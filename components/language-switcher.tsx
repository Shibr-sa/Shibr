"use client"

import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { ChevronDown, Globe } from "lucide-react"
import { useLanguage } from "@/contexts/localization-context"

export function LanguageSwitcher() {
  const { language, setLanguage, t } = useLanguage()

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          <span>{t(language === "ar" ? "common.language.arabic" : "common.language.english")}</span>
          <ChevronDown className="h-4 w-4 ms-1" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => setLanguage("ar")} className="gap-2">
          <span>{t("common.language.arabic")}</span>
          {language === "ar" && <span className="text-primary">✓</span>}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setLanguage("en")} className="gap-2">
          <span>{t("common.language.english")}</span>
          {language === "en" && <span className="text-primary">✓</span>}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
