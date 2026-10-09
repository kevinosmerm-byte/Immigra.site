import React from 'react';
import './premium-icons.css';
export function PremiumIcon({name='notebook',library='3dicons',className=''}) {return <span className={`premium-icon ${className}`} aria-hidden="true"><img src={`/icons/${library}/${name}.png`} alt="" width="96" height="96" decoding="async"/></span>;}
export function FreeIcon({name='arrow-right-01'}) {return <img className="free-icon" src={`/icons/hugeicons/${name}.svg`} alt="" aria-hidden="true" width="24" height="24"/>;}
