import {css} from '../vendor/lit-element/lit-element.js'
import buttonsCSS from './com/buttons.css.js'
import tooltipCSS from './com/tooltip.css.js'
import spinnerCSS from './com/spinner.css.js'

const cssStr = css`
${buttonsCSS}
${tooltipCSS}
${spinnerCSS}

:host {
  display: block;
}

.hidden {
  display: none !important;
}

a {
  text-decoration: none;
  color: inherit;
}

a:hover {
  text-decoration: underline;
}

.profile-banner {
  text-align: center;
  padding: 0 0 10px;
  border-bottom: 1px solid var(--border-color--very-light);
  margin-bottom: 20px;
}

.profile-banner .avatar {
  display: block;
  margin: 0 auto 20px;
  width: 160px;
  border-radius: 50%;
  box-shadow: 0 1px 3px #0005;
}

.profile-banner .display-name {
  margin: 0;
  letter-spacing: 1px;
  font-size: 31px;
  font-weight: 500;
}

.profile-banner .username {
  margin: 0;
  letter-spacing: 1px;
  color: var(--text-color--pretty-light);
}

.profile-banner .bio {
  color: var(--text-color--light);
  font-size: 16px;
}

.profile-banner .stat {
  font-size: 13px;
  font-weight: 500;
  color: var(--text-color--pretty-light);
  cursor: pointer;
}

.profile-banner .stat .stat-number {
  font-size: 17px;
}

main {
}

.twocol {
  margin: 10px auto 20px;
  max-width: 840px;
  display: grid;
  grid-template-columns: minmax(0, 1fr) 200px;
  gap: 30px;
}

.twocol .sticky {
  position: sticky;
  top: 10px;
}

.twocol .sidebar > div {
  padding-bottom: 4px;
}

.twocol .sidebar h3 {
  box-sizing: border-box;
  letter-spacing: 1px;
  margin: 3px 0;
  font-weight: bold;
  text-transform: uppercase;
  font-size: 11px;
  color: var(--text-color--pretty-light);
}

.twocol .sidebar section {
  margin-bottom: 20px;
}

@media (max-width: 900px) {
  .twocol {
    display: block;
  }
  .two .sidebar section {
    margin-bottom: 0;
  }
  .two > :last-child {
    display: none;
  }
  ctzn-sites-list {
    margin-top: 20px;
  }
}

.nav a {
  display: block;
  font-size: 16px;
  padding: 5px;
  margin-bottom: 5px;
}

.nav .fa-fw {
  display: inline-block;
  font-size: 12px;
  margin-right: 4px;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  line-height: 28px;
  color: var(--text-color--default);
  background: var(--bg-color--semi-light);
}

.nav a.current {
  font-weight: 500;
  color: var(--text-color--markdown-link);
}

.nav a.current .fa-fw {
  color: #fff;
  background: var(--text-color--markdown-link);
}

.nav sup {
  font-weight: bold;
  color: #fff;
  background: var(--text-color--markdown-link);
  border-radius: 4px;
  padding: 1px 4px 2px;
  font-size: 9px;
  font-weight: bold;
}

ctzn-record-feed,
ctzn-sites-list {
  margin-bottom: 10px;
}

ctzn-record-feed {
  --ctzn-record-feed--default-margin: 20px;
}

.empty {
  font-size: 16px;
  letter-spacing: 0.7px;
  color: var(--text-color--light);
  padding: 60px 0px;
  background: var(--bg-color--light);
  text-align: center;
}

.sidebar .user-controls button {
  font-size: 17px;
  letter-spacing: 1px;
  display: block;
  width: 100%;
  padding: 8px;
}
`
export default cssStr