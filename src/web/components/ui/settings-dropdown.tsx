"use client"

import * as React from "react"
import { Settings, Moon, Sun, Monitor } from "lucide-react"
import { useTheme } from "next-themes"
import { Locale, useTranslation } from "@/lib/i18n"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import Image from "next/image"

interface SettingsDropdownProps {
  currentLocale: Locale;
  onLocaleChange: (locale: Locale) => void;
}

export function SettingsDropdown({ currentLocale, onLocaleChange }: SettingsDropdownProps) {
  const { setTheme } = useTheme()
  const { t } = useTranslation(currentLocale)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="w-full justify-start">
          <Settings className="w-4 h-4 mr-2" />
          {t('common.settings')}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>{t('common.language')}</DropdownMenuLabel>
        <DropdownMenuItem onClick={() => onLocaleChange("pt")}>
          <Image src="/pt-BR.svg" alt="Brasil" className="w-4 h-4 mr-2" width={16} height={16} />
          {t('common.portuguese')}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onLocaleChange("en")}>
          <Image src="/en-US.svg" alt="Estados Unidos" className="w-4 h-4 mr-2" width={16} height={16} />
          {t('common.english')}
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuLabel>{t('common.theme')}</DropdownMenuLabel>
        <DropdownMenuItem onClick={() => setTheme("light")}>
          <Sun className="w-4 h-4 mr-2" />
          {t('common.light')}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("dark")}>
          <Moon className="w-4 h-4 mr-2" />
          {t('common.dark')}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("system")}>
          <Monitor className="w-4 h-4 mr-2" />
          {t('common.system')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
