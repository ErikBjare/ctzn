import { BaseHyperbeeDB } from './base.js'
import { constructUserId, constructEntryUrl } from '../lib/strings.js'
import { fetchUserId } from '../lib/network.js'
import lock from '../lib/lock.js'

export class PublicServerDB extends BaseHyperbeeDB {
  async setup () {
    await super.setup()
    this.indexState = this.getTable('ctzn.network/index-state')
    this.users = this.getTable('ctzn.network/user')
    this.featuredPostsIdx = this.getTable('ctzn.network/featured-post-idx')
    this.followsIdx = this.getTable('ctzn.network/follow-idx')
    this.commentsIdx = this.getTable('ctzn.network/comment-idx')
    this.votesIdx = this.getTable('ctzn.network/vote-idx')

    this.createIndexer('ctzn.network/follow-idx', ['ctzn.network/follow'], async (db, change) => {
      const release = await lock('follows-idx')
      try {
        let subject = change.value?.subject
        if (!subject) {
          const oldEntry = await db.bee.checkout(change.seq).get(change.key)
          subject = oldEntry.value.subject
        }

        let followsIdxEntry = await this.followsIdx.get(subject.userId).catch(e => undefined)
        if (!followsIdxEntry) {
          followsIdxEntry = {
            key: subject.userId,
            value: {
              subjectId: subject.userId,
              followerIds: []
            }
          }
        }
        const followerId = await fetchUserId(db.url)
        const followerIdIndex = followsIdxEntry.value.followerIds.indexOf(followerId)
        if (change.value) {
          if (followerIdIndex === -1) {
            followsIdxEntry.value.followerIds.push(followerId)
          }
        } else {
          if (followerIdIndex !== -1) {
            followsIdxEntry.value.followerIds.splice(followerIdIndex, 1)
          }
        }
        await this.followsIdx.put(followsIdxEntry.key, followsIdxEntry.value)
      } finally {
        release()
      }
    })

    this.createIndexer('ctzn.network/comment-idx', ['ctzn.network/comment'], async (db, change) => {
      const release = await lock('comments-idx')
      try {
        const commentUrl = constructEntryUrl(db.url, 'ctzn.network/comment', change.keyParsed.key)
        let subjectUrl = change.value?.subjectUrl
        if (!subjectUrl) {
          const oldEntry = await db.bee.checkout(change.seq).get(change.key)
          subjectUrl = oldEntry.value.subjectUrl
        }

        let commentsIdxEntry = await this.commentsIdx.get(subjectUrl).catch(e => undefined)
        if (!commentsIdxEntry) {
          commentsIdxEntry = {
            key: subjectUrl,
            value: {
              subjectUrl,
              commentUrls: []
            }
          }
        }
        let commentUrlIndex = commentsIdxEntry.value.commentUrls.indexOf(commentUrl)
        if (change.value) {
          if (commentUrlIndex === -1) {
            commentsIdxEntry.value.commentUrls.push(commentUrl)
          }
        } else {
          if (commentUrlIndex !== -1) {
            commentsIdxEntry.value.commentUrls.splice(commentUrlIndex, 1)
          }
        }
        await this.commentsIdx.put(commentsIdxEntry.key, commentsIdxEntry.value)
      } finally {
        release()
      }
    })

    this.createIndexer('ctzn.network/vote-idx', ['ctzn.network/vote'], async (db, change) => {
      const release = await lock('votes-idx')
      try {
        const voteUrl = constructEntryUrl(db.url, 'ctzn.network/vote', change.keyParsed.key)
        let subjectUrl = change.value?.subjectUrl
        if (!subjectUrl) {
          const oldEntry = await db.bee.checkout(change.seq).get(change.key)
          subjectUrl = oldEntry.value.subjectUrl
        }

        let votesIdxEntry = await this.votesIdx.get(subjectUrl).catch(e => undefined)
        if (!votesIdxEntry) {
          votesIdxEntry = {
            key: change.keyParsed.key,
            value: {
              subjectUrl: subjectUrl,
              upvoteUrls: [],
              downvoteUrls: []
            }
          }
        }
        let upvoteUrlIndex = votesIdxEntry.value.upvoteUrls.indexOf(voteUrl)
        if (upvoteUrlIndex !== -1) votesIdxEntry.value.upvoteUrls.splice(upvoteUrlIndex, 1)
        let downvoteUrlIndex = votesIdxEntry.value.downvoteUrls.indexOf(voteUrl)
        if (downvoteUrlIndex !== -1) votesIdxEntry.value.downvoteUrls.splice(downvoteUrlIndex, 1)
  
        if (change.value) {
          if (change.value.vote === 1) {
            votesIdxEntry.value.upvoteUrls.push(voteUrl)
          } else if (change.value.vote === -1) {
            votesIdxEntry.value.downvoteUrls.push(voteUrl)
          }
        }
  
        await this.votesIdx.put(votesIdxEntry.key, votesIdxEntry.value)
      } finally {
        release()
      }
    })
  }

  async getSubscribedDbUrls () {
    return (await this.users.list()).map(entry => entry.value.dbUrl)
  }

  async onDatabaseCreated () {
    console.log('New public server database created, key:', this.key.toString('hex'))
  }
}

export class PrivateServerDB extends BaseHyperbeeDB {
  constructor (key, publicServerDb) {
    super(key)
    this.publicServerDb = publicServerDb
  }

  async setup () {
    await super.setup()
    this.indexState = this.getTable('ctzn.network/index-state')
    this.accounts = this.getTable('ctzn.network/account')
    this.accountSessions = this.getTable('ctzn.network/account-session')
    this.userDbIdx = this.getTable('ctzn.network/user-db-idx')

    this.createIndexer('ctzn.network/user-db-idx', ['ctzn.network/user'], async (db, change) => {
      const release = await lock('user-db-idx')
      try {
        let oldEntry = await db.bee.checkout(change.seq).get(change.key)
        if (oldEntry?.value?.dbUrl) {
          await this.userDbIdx.del(oldEntry.value.dbUrl)
        }
        if (change.value) {
          await this.userDbIdx.put(change.value.dbUrl, {
            dbUrl: change.value.dbUrl,
            userId: constructUserId(change.value.username)
          })
        }
      } finally {
        release()
      }
    })
  }

  async getSubscribedDbUrls () {
    return [this.publicServerDb.url]
  }
  
  async onDatabaseCreated () {
    console.log('New private server database created, key:', this.key.toString('hex'))
  }
}