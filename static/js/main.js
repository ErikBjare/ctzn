import { LitElement, html } from '../vendor/lit-element/lit-element.js'
import { ViewThreadPopup } from './com/popups/view-thread.js'
import * as toast from './com/toast.js'
import { create as createRpcApi } from './lib/rpc-api.js'
import { pluralize } from './lib/strings.js'
import * as QP from './lib/qp.js'
import css from '../css/main.css.js'
import './com/header.js'
import './com/composer.js'
import './com/feed.js'
import './com/img-fallbacks.js'

const TITLE = document.title

class CtznApp extends LitElement {
  static get properties () {
    return {
      profile: {type: Object},
      isComposingPost: {type: Boolean},
      searchQuery: {type: String},
      isEmpty: {type: Boolean},
      numNewItems: {type: Number}
    }
  }

  static get styles () {
    return css
  }

  constructor () {
    super()
    this.profile = undefined
    this.isComposingPost = false
    this.searchQuery = ''
    this.isEmpty = false
    this.numNewItems = 0
    this.loadTime = Date.now()

    this.load()

    setInterval(this.checkNewItems.bind(this), 5e3)

    window.addEventListener('popstate', (event) => {
      this.configFromQP()
    })
  }

  async load ({clearCurrent} = {clearCurrent: false}) {
    this.api = await createRpcApi()
    this.profile = await this.api.accounts.whoami()
    if (!this.profile) {
      return this.requestUpdate()
    }
    if (this.shadowRoot.querySelector('ctzn-feed')) {
      this.loadTime = Date.now()
      this.numNewItems = 0
      this.shadowRoot.querySelector('ctzn-feed').load({clearCurrent})
    }
    
    if ((new URL(window.location)).searchParams.has('composer')) {
      this.isComposingPost = true
      window.history.replaceState({}, null, '/')
    }
  }

  async checkNewItems () {
    if (location.pathname === '/search') return
    // TODO check for new items
    // var query = PATH_QUERIES[location.pathname.slice(1) || 'all']
    // if (!query) return
    // var {count} = await beaker.index.gql(`
    //   query NewItems ($paths: [String!]!, $loadTime: Long!) {
    //     count: recordCount(
    //       paths: $paths
    //       after: {key: "crtime", value: $loadTime}
    //     )
    //   }
    // `, {paths: query, loadTime: this.loadTime})
    // this.numNewItems = count
  }

  get isLoading () {
    let queryViewEls = Array.from(this.shadowRoot.querySelectorAll('ctzn-feed'))
    return !!queryViewEls.find(el => el.isLoading)
  }

  // rendering
  // =

  render () {
    return html`
      <link rel="stylesheet" href="/css/fontawesome.css">
      <main>
        <ctzn-header .api=${this.api} .profile=${this.profile}></ctzn-header>
        ${this.renderCurrentView()}
      </main>
    `
  }

  renderRightSidebar () {
    return html`
      <div class="sidebar">
        <div class="sticky">
          <div class="search-ctrl">
            <span class="fas fa-search"></span>
            ${!!this.searchQuery ? html`
              <a class="clear-search" @click=${this.onClickClearSearch}><span class="fas fa-times"></span></a>
            ` : ''}
            <input @keyup=${this.onKeyupSearch} placeholder="Search" value=${this.searchQuery}>
          </div>
        </div>
      </div>
    `
  }

  renderCurrentView () {
    if (!this.api) {
      return ''
    }
    var hasSearchQuery = !!this.searchQuery
    if (hasSearchQuery) {
      return html`
        <div class="twocol">
          <div>
            ${''/* TODO render search results 
            ${this.renderSites('all')}
            <h3 class="feed-heading">Discussion</h3>
            <ctzn-feed
              .pathQuery=${PATH_QUERIES.search.discussion}
              .filter=${this.searchQuery}
              limit="50"
              empty-message="No results found${this.searchQuery ? ` for "${this.searchQuery}"` : ''}"
              @load-state-updated=${this.onFeedLoadStateUpdated}
              @view-thread=${this.onViewThread}
              @publish-reply=${this.onPublishReply}
              profile-url=${this.profile ? this.profile.url : ''}
            ></ctzn-feed>*/}
          </div>
          ${this.renderRightSidebar()}
        </div>
      `
    } else {
      return html`
        <div class="twocol">
          <div>
            <div class="composer">
              <img class="thumb" src="/${this.profile?.userId}/avatar">
              ${this.isComposingPost ? html`
                <ctzn-composer
                  .api=${this.api}
                  @publish=${this.onPublishPost}
                  @cancel=${this.onCancelPost}
                ></ctzn-composer>
              ` : html`
                <div class="compose-post-prompt" @click=${this.onComposePost}>
                  What's new?
                </div>
              `}
            </div>
            ${this.isEmpty ? this.renderEmptyMessage() : ''}
            <div class="reload-page ${this.numNewItems > 0 ? 'visible' : ''}" @click=${e => this.load()}>
              ${this.numNewItems} new ${pluralize(this.numNewItems, 'update')}
            </div>
            <ctzn-feed
              .api=${this.api}
              .profile=${this.profile}
              limit="50"
              @load-state-updated=${this.onFeedLoadStateUpdated}
              @view-thread=${this.onViewThread}
              @publish-reply=${this.onPublishReply}
            ></ctzn-feed>
          </div>
          ${this.renderRightSidebar()}
        </div>
      `
    }
  }

  renderEmptyMessage () {
    if (this.searchQuery) {
      return html`
        <div class="empty">
            <div class="fas fa-search"></div>
          <div>No results found for "${this.searchQuery}"</div>
        </div>
      `
    }
    return html`
      <div class="empty">
        <div class="fas fa-stream"></div>
        <div>Subscribe to sites to see what's new</div>
      </div>
    `
  }

  // events
  // =

  onFeedLoadStateUpdated (e) {
    if (typeof e.detail?.isEmpty !== 'undefined') {
      this.isEmpty = e.detail.isEmpty
    }
    this.requestUpdate()
  }

  onKeyupSearch (e) {
    if (e.code === 'Enter') {
      window.location = `/search?q=${e.currentTarget.value.toLowerCase()}`
    }
  }

  onClickClearSearch (e) {
    window.location = '/'
  }

  onViewThread (e) {
    ViewThreadPopup.create({
      api: this.api,
      subjectUrl: e.detail.subject.url,
      profile: this.profile
    })
  }

  onComposePost (e) {
    this.isComposingPost = true
  }

  onCancelPost (e) {
    this.isComposingPost = false
  }

  onPublishPost (e) {
    this.isComposingPost = false
    toast.create('Post published', '', 10e3)
    this.load()
  }

  onPublishReply (e) {
    toast.create('Reply published', '', 10e3)
    this.load()
  }
}

customElements.define('ctzn-app', CtznApp)
