import axios from 'axios'
import {map, prop} from 'ramda'

const defaultMerge = (bodyData, resData) => resData
const removeDomain = (cookie) => cookie.replace(/domain=.+?(;|$)/, '')

const buildFilters = (specificationFilters = []) => {
  let filters = ''
  for (const filter of specificationFilters) {
    filters += 'fq=specificationFilter_' + filter + '&'
  }
  return filters ? '&' + filters.replace(/&$/, '') : ''
}

export default (
    {method = 'GET', url, data = null, headers = {}, enableCookies = false, merge = defaultMerge}:
    {method?: string, url?: any, data?: any, headers?: any, enableCookies?: boolean, merge?: (bodyData: any, responseData: any) => any},
  ) => {
  return async (body, ioContext) => {
    body.data.specificationFilters = buildFilters(body.data.specificationFilters)
    const builtUrl = (typeof url === 'function') ? url(ioContext.account, body.data, body.root) : url
    const builtData = (typeof data === 'function') ? data(body.data) : data
    const builtHeaders = (typeof headers === 'function') ? await headers(ioContext) : headers

    const config = {method, url: builtUrl, data: builtData, headers: builtHeaders}
    if (enableCookies && body.cookie) {
      config.headers.cookie = body.cookie
    }

    const vtexResponse = await axios.request(config)

    let cookie
    if (enableCookies) {
      const setCookie = prop('set-cookie', vtexResponse.headers)
      if (setCookie) {
        cookie = map(removeDomain, setCookie)
      }
    }
    return {cookie, data: merge(body.data, vtexResponse.data)}
  }
}
