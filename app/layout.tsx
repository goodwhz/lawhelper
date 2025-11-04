import { getLocaleOnServer } from '@/i18n/server'

import './styles/globals.css'
import './styles/markdown.scss'

const LocaleLayout = async ({
  children,
}: {
  children: React.ReactNode
}) => {
  const locale = await getLocaleOnServer()
  return (
    <html lang={locale ?? 'en'} className="h-full">
      <body className="h-full">
        <div className="w-full h-full overflow-x-hidden overflow-y-auto">
          <div className="w-full min-w-[300px] max-w-full">
            {children}
          </div>
        </div>
      </body>
    </html>
  )
}

export default LocaleLayout
