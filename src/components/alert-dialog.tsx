import * as React from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { useTranslation } from "react-i18next"

interface AlertDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title?: string
  description: string
  okText?: string
}

export function AlertDialog({
  open,
  onOpenChange,
  title = "alert.error",
  description,
  okText = "alert.ok",
}: AlertDialogProps) {
  const { t } = useTranslation()
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{t(title)}</DialogTitle>
          <div className="pt-2">
            {description && <DialogDescription>{description}</DialogDescription>}
          </div>
        </DialogHeader>
        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>{t(okText)}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
