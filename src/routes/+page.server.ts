import { CalendarResponse, ReservedResponse } from "$lib/types"
import { getNextSundayDate } from "$lib/utils"

const reservedUrl = 'https://malmo.rbok.se/KundBokaResurser/GetReserveradeTiderOchEjOppettider'
const calendarUrl = 'https://malmo.rbok.se/KundBokaResurser/KalenderScheduler_Read'

export async function load() {
  const nextSundayDate = getNextSundayDate()
  const [dateStr] = nextSundayDate.toISOString().split('T')

  const reservedPayload = `valdaResurser%5B0%5D%5BId%5D=2a34ae50-60d9-4ccb-b890-c5da9aab043e&valdaResurser%5B0%5D%5BNamn%5D=Sorgenfri+IP+%2F+Konstgr%C3%A4s+11-manna&valdaResurser%5B0%5D%5BBeskrivning%5D=Sorgenfri+IP+%2F+Konstgr%C3%A4s+11-manna&valdaResurser%5B0%5D%5BLas%5D=False&valdaResurser%5B0%5D%5BSkriv%5D=False&valdaResurser%5B0%5D%5BFarBokas%5D=False&valdaResurser%5B1%5D%5BId%5D=19444fe5-e625-4ca8-8b4c-d699bb1dfc7d&valdaResurser%5B1%5D%5BNamn%5D=Sorgenfri+IP+%2F+Konstgr%C3%A4s+11-manna+%2F+7-manna+1&valdaResurser%5B1%5D%5BBeskrivning%5D=Sorgenfri+IP+%2F+Konstgr%C3%A4s+11-manna+%2F+7-manna+1&valdaResurser%5B1%5D%5BLas%5D=False&valdaResurser%5B1%5D%5BSkriv%5D=False&valdaResurser%5B1%5D%5BFarBokas%5D=False&valdaResurser%5B2%5D%5BId%5D=a4204133-591e-4dad-b5be-08c94288c5ad&valdaResurser%5B2%5D%5BNamn%5D=Sorgenfri+IP+%2F+Konstgr%C3%A4s+11-manna+%2F+7-manna+2&valdaResurser%5B2%5D%5BBeskrivning%5D=Sorgenfri+IP+%2F+Konstgr%C3%A4s+11-manna+%2F+7-manna+2&valdaResurser%5B2%5D%5BLas%5D=False&valdaResurser%5B2%5D%5BSkriv%5D=False&valdaResurser%5B2%5D%5BFarBokas%5D=False&datumStart=${dateStr}&datumSlut=${dateStr}`

  const calendarPayload = `sort=&group=&filter=&start=${dateStr}+00%3A00&slut=${dateStr}+00%3A00&resurser%5B0%5D.Id=2a34ae50-60d9-4ccb-b890-c5da9aab043e&resurser%5B0%5D.Namn=Sorgenfri+IP+%2F+Konstgr%C3%A4s+11-manna&resurser%5B0%5D.Beskrivning=Sorgenfri+IP+%2F+Konstgr%C3%A4s+11-manna&resurser%5B0%5D.Las=False&resurser%5B0%5D.Skriv=False&resurser%5B0%5D.FarBokas=False&resurser%5B1%5D.Id=19444fe5-e625-4ca8-8b4c-d699bb1dfc7d&resurser%5B1%5D.Namn=Sorgenfri+IP+%2F+Konstgr%C3%A4s+11-manna+%2F+7-manna+1&resurser%5B1%5D.Beskrivning=Sorgenfri+IP+%2F+Konstgr%C3%A4s+11-manna+%2F+7-manna+1&resurser%5B1%5D.Las=False&resurser%5B1%5D.Skriv=False&resurser%5B1%5D.FarBokas=False&resurser%5B2%5D.Id=a4204133-591e-4dad-b5be-08c94288c5ad&resurser%5B2%5D.Namn=Sorgenfri+IP+%2F+Konstgr%C3%A4s+11-manna+%2F+7-manna+2&resurser%5B2%5D.Beskrivning=Sorgenfri+IP+%2F+Konstgr%C3%A4s+11-manna+%2F+7-manna+2&resurser%5B2%5D.Las=False&resurser%5B2%5D.Skriv=False&resurser%5B2%5D.FarBokas=False`

  // const reservedRequest = fetch(reservedUrl, {
  //   method: 'POST',
  //   body: reservedPayload,
  //   headers: {
  //     accept: 'application/json',
  //     'content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
  //   }
  // })

  const calendarRequest = fetch(calendarUrl, {
    method: 'POST',
    body: calendarPayload,
    headers: {
      accept: 'application/json',
      'content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
    }
  })
  
  const [
    // reservedResponseData,
    calendarResponseData
  ] = await Promise.all([
    // reservedRequest.then((response) => response.json() as Promise<ReservedResponse>),
    calendarRequest.then((response) => response.json() as Promise<CalendarResponse>)
  ])

  return {
    date: nextSundayDate,
    // reserved: reservedResponseData,
    calendar: calendarResponseData,
  }
}