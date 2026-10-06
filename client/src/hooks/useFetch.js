import { useCallback, useEffect, useState } from 'react';
import api, { getError } from '../api/axios';

// Loads data from a URL and tracks loading + error. Call reload() to refresh.
export default function useFetch(url) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const reload = useCallback(() => {
    setError('');
    return api
      .get(url)
      .then((res) => setData(res.data))
      .catch((err) => setError(getError(err)))
      .finally(() => setLoading(false));
  }, [url]);

  useEffect(() => {
    reload();
  }, [reload]);

  return { data, loading, error, reload };
}
