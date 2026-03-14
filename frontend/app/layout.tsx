import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from '@/components/ThemeProvider'
import ThemeToggle from '@/components/ThemeToggle'

const inter = Inter({
    subsets: ['latin'],
    display: 'swap',
    variable: '--font-inter',
})

export const metadata: Metadata = {
    title: 'FinConnect Axis | Education Loan Facilitation',
    description: 'Split school fees into easy monthly installments. Fast digital onboarding, flexible payments, and a secure student-first loan facilitation network.',
    keywords: 'education loan, school fees, student finance, FinConnect Axis, loan facilitation',
}

export default function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <html lang="en" data-theme="dark" className={inter.variable} suppressHydrationWarning>
            <head>
                <link rel="icon" href="/favicon.ico" />
                <meta name="viewport" content="width=device-width, initial-scale=1" />
            </head>
            <body className={`${inter.className} min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] antialiased transition-colors duration-300`} suppressHydrationWarning>
                <ThemeProvider>
                    {children}
                    <ThemeToggle />
                </ThemeProvider>
            </body>
        </html>
    )
}
