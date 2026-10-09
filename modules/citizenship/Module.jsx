import React from 'react';
import App from './src/App.jsx';
import {AccountProvider} from './src/Account.jsx';
import {PromotionAccessProvider} from './src/PromotionAccess.jsx';
import {PodcastProvider} from './src/PodcastPlayer.jsx';
import AppErrorBoundary from './src/AppErrorBoundary.jsx';
import './src/index.css';
import '../../shared/design-system/platform.css';
export default function Citizenship({lang,onLanguageChange}){return <section className="citizenship-surface"><div id="citizenship-root"><AppErrorBoundary><PromotionAccessProvider><PodcastProvider><App platformLanguage={lang} onPlatformLanguageChange={onLanguageChange}/></PodcastProvider></PromotionAccessProvider></AppErrorBoundary></div></section>}
