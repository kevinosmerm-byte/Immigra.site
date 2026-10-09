import {FreeIcon} from './PremiumIcon.jsx';
import {GlassCard,GlassTabBar} from './Glass.jsx';
import React from 'react';
export function SectionTitle({eyebrow,title,description,children}){return <div className="platform-title"><span className="platform-eyebrow">{eyebrow}</span><h1>{title}</h1>{description&&<p>{description}</p>}{children}</div>;}
export function ActionCard({title,description,onClick,icon='↗'}){return <GlassCard as="button" className="platform-card" onClick={onClick}><span className="platform-card-icon" aria-hidden="true">{icon}</span><strong>{title}</strong>{description&&<span>{description}</span>}<span className="platform-card-arrow" aria-hidden="true"><FreeIcon/></span></GlassCard>;}
export function ModuleNavigation(props){return <GlassTabBar {...props} className="platform-module-nav"/>;}
