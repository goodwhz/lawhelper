import 'server-only'

import { cookies } from 'next/headers'
import type { Locale } from '.'
import { i18n } from '.'

export const getLocaleOnServer = async (): Promise<Locale> => {
  // get locale from cookie
  const localeCookie = (await cookies()).get('locale')
  const localeFromCookie = localeCookie?.value

  // Check if the cookie locale is valid
  if (localeFromCookie && i18n.locales.includes(localeFromCookie as Locale)) {
    return localeFromCookie as Locale
  }

  // Return default locale
  return i18n.defaultLocale
}
