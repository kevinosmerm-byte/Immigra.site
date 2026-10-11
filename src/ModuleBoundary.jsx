import React from 'react';
export default class ModuleBoundary extends React.Component {
  state={failed:false};
  static getDerivedStateFromError(){return {failed:true};}
  componentDidCatch(){console.error('[module-load] MODULE_UNAVAILABLE');}
  componentDidUpdate(previous){if(this.state.failed&&previous.route!==this.props.route)this.setState({failed:false});}
  render(){
    if(!this.state.failed)return this.props.children;
    const es=this.props.lang!=='en';
    return <section className="detail" role="alert"><h1>{es?'No pudimos cargar esta pantalla':'This screen could not load'}</h1><p>{es?'Puede haber una actualización reciente o una interrupción de conexión. Revisa tu conexión y recarga para obtener la versión actual.':'There may be a recent update or a connection interruption. Check your connection and reload to get the current version.'}</p><p>{es?'Al recargar se descarta la práctica que permanezca solo en memoria.':'Reloading discards practice that remains only in memory.'}</p><button className="back" onClick={()=>window.location.reload()}>{es?'Recargar aplicación':'Reload application'}</button></section>;
  }
}
