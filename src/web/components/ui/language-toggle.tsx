"use client"

import * as React from "react"
import { Globe } from "lucide-react"
import { useTranslation, Locale } from "@/lib/i18n"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface LanguageToggleProps {
  currentLocale: Locale;
  onLocaleChange: (locale: Locale) => void;
}

export function LanguageToggle({ currentLocale, onLocaleChange }: LanguageToggleProps) {
  const { t } = useTranslation(currentLocale);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon">
          <Globe className="h-[1.2rem] w-[1.2rem]" />
          <span className="sr-only">Alternar idioma</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => onLocaleChange("pt")}>
          🇧🇷 Português
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onLocaleChange("en")}>
          🇺🇸 English
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
