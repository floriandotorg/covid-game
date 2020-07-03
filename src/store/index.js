import { combineReducers, createStore, applyMiddleware, compose } from 'redux'
import thunk from 'redux-thunk'
import { simulationReducer, simulationStart } from './simulation'
import { newsReducer } from './news'

const reducer = combineReducers({
  simulation: simulationReducer,
  news: newsReducer
})

const composeEnhancers = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose

const store = createStore(reducer, composeEnhancers(applyMiddleware(thunk)))

window.Module = {}
Module.onRuntimeInitialized = () => {
  store.dispatch(simulationStart())
}

const script = document.createElement('script')
script.type = 'text/javascript'
script.src = '/src/sim.js'
document.getElementsByTagName('head')[0].appendChild(script)

export default store
