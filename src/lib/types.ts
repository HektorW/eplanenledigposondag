export type TimeSlot
  = {
    ResursIndex: number
    DagIndex: number
    StartMinut: number
    SlutMinut: number
  }

export type ReservedResponse
  = {
    ArbetsdagStart: number
    ArbetsdagSlut: number
    EjOppettider: TimeSlot[]
    ReserveradeTider: TimeSlot[]
  }

/** 
 * Timestamp in milliseconds
 * 
 * @example "/Date(1723374000000)/"
 */
export type DateStr = string

/** @example "#ffffff" */
export type HexStr = string

export type CalendarEntry
  = {
    ActualEnd: DateStr
    Arendenr: unknown
    Bakgrundsfarg: HexStr
    BokadAv: string
    Description: string
    End: DateStr
    EndTimezone: unknown
    Eventbokning: boolean
    GrupperAsString: string
    Id: string
    Ikon: unknown
    IsAllDay: boolean
    KundTillatAvboka: boolean
    Ovrigt: unknown
    RecurrenceException: unknown
    RecurrenceId: unknown
    RecurrenceRule: unknown
    /** Field id */
    Resurs: string
    Start: DateStr
    StartTimezone: unknown
    /** Unknown meaning */
    Status: number
    Textfarg: HexStr
    Tillagg: boolean
    TillaggForId: unknown
    TillaggForResursId: unknown
    Title: string
    Verksamhet: string
  }

export type CalendarResponse
  = {
    Data: CalendarEntry[]
    Total: number
    AggregateResults: unknown
    Errors: unknown
  }