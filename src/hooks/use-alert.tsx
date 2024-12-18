import * as React from "react"
import { AlertDialog } from "@/components/alert-dialog"

interface AlertContextType {
  alert: (message: string, title?: string) => void
}

const AlertContext = React.createContext<AlertContextType | undefined>(undefined)

export function AlertProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = React.useState(false)
  const [message, setMessage] = React.useState("")
  const [title, setTitle] = React.useState<string | undefined>(undefined)

  const alert = React.useCallback((message: string, title?: string) => {
    setMessage(message)
    setTitle(title)
    setOpen(true)
  }, [])

  return (
    <AlertContext.Provider value={{ alert }}>
      {children}
      <AlertDialog
        open={open}
        onOpenChange={setOpen}
        title={title}
        description={message}
      />
    </AlertContext.Provider>
  )
}

export function useAlert() {
  const context = React.useContext(AlertContext)
  if (context === undefined) {
    throw new Error("useAlert must be used within an AlertProvider")
  }
  return context
}
