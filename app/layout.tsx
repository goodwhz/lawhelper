import { getLocaleOnServer } from '@/i18n/server'
import AuthProviderClient from '@/app/components/auth-provider-client'
import './styles/globals.css'
import './styles/markdown.scss'
import '../styles/mobile-optimized.css'

const LocaleLayout = async ({
  children,
}: {
  children: React.ReactNode
}) => {
  const locale = await getLocaleOnServer()
  return (
    <html lang={locale ?? 'en'} className="h-full">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body className="h-full">
        <AuthProviderClient>
          <div className="w-full h-full overflow-x-hidden overflow-y-auto">
            <div className="w-full min-w-[320px] max-w-full">
              {children}
            </div>
          </div>
        </AuthProviderClient>
      </body>
    </html>
  )
}

export default LocaleLayout
