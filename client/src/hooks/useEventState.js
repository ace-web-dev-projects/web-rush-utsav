import { useEffect, useState } from 'react'
import { api } from '../api.js'

const pollInterval = 2000

function useEventState(enabled) {
  const [eventState, setEventState] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!enabled) return undefined

    let isMounted = true
    let timeoutId
    let controller

    async function poll() {
      controller = new AbortController()

      try {
        const { data } = await api.get('/event/state', { signal: controller.signal })
        if (isMounted) {
          setEventState(data.eventState)
          setError('')
        }
      } catch (requestError) {
        if (isMounted && requestError.code !== 'ERR_CANCELED') {
          setError('Could not reach the event server. Reconnecting…')
        }
      } finally {
        if (isMounted) timeoutId = setTimeout(poll, pollInterval)
      }
    }

    poll()

    return () => {
      isMounted = false
      clearTimeout(timeoutId)
      controller?.abort()
    }
  }, [enabled])

  return { eventState, error }
}

export default useEventState
