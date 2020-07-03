import _ from 'lodash'
import React, { useEffect, useRef, useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { Marquee } from 'dynamic-marquee'
import { newsRemove } from '../store/news'

export const NewsTicker = () => {
  const elem = useRef()
  const dispatch = useDispatch()
  const [marquee, setMarquee] = useState()
  const [rerender, setRerender] = useState()
  const { announcements } = useSelector(s => s.news)

  useEffect(() => {
    const marquee = new Marquee(elem.current, {
      rate: -100
    })
    marquee.onItemRequired(() => {
      setRerender(Math.random())
    })
    setMarquee(marquee)
  }, [])

  useEffect(() => {
    announcements.forEach(announcement => {
      if (marquee.isWaitingForItem()) {
        const item = document.createElement('div')
        item.innerHTML = `&nbsp;&nbsp;&nbsp;${announcement.text}&nbsp;&nbsp;&nbsp;`
        marquee.appendItem(item)
        dispatch(newsRemove(announcement.id))
      }
    })
  }, [rerender, announcements])

  return <div id='news-ticker' ref={elem} />
}
