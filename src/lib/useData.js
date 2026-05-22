import { useState, useEffect } from 'react'
import { dataService, subscribeRefresh } from './dataService'

export function useData(fetchFn, deps = []) {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let mounted = true

    const load = async () => {
      try {
        const result = await fetchFn()
        if (mounted) {
          setData(result || [])
          setError(null)
        }
      } catch (err) {
        if (mounted) setError(err.message)
      } finally {
        if (mounted) setLoading(false)
      }
    }

    load()

    const unsub = subscribeRefresh(() => {
      if (mounted) load()
    })

    return () => { mounted = false; unsub() }
  }, deps)

  return { data, loading, error }
}

export {
  dataService
}
