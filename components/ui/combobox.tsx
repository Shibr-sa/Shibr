"use client"

import * as React from "react"
import { Check, ChevronsUpDown } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"

interface ComboboxProps {
    value: string
    onChange: (value: string) => void
    options: string[]
    placeholder?: string
    searchPlaceholder?: string
    emptyMessage?: string
    disabled?: boolean
    className?: string
}

export function Combobox({
    value,
    onChange,
    options,
    placeholder = "Select option...",
    searchPlaceholder = "Search options...",
    emptyMessage = "No options found.",
    disabled = false,
    className,
}: ComboboxProps) {
    const [open, setOpen] = React.useState(false)
    const [inputValue, setInputValue] = React.useState(value)

    // Update input value when external value changes
    React.useEffect(() => {
        setInputValue(value)
    }, [value])

    const handleSelect = (selectedValue: string) => {
        // If it's a predefined option, use it directly
        if (options.includes(selectedValue)) {
            onChange(selectedValue)
            setInputValue(selectedValue)
        } else {
            // If it's a custom value, use the current input value
            onChange(inputValue)
        }
        setOpen(false)
    }

    const handleInputChange = (newValue: string) => {
        setInputValue(newValue)
        onChange(newValue)
    }

    const filteredOptions = options.filter(option =>
        option.toLowerCase().includes(inputValue.toLowerCase())
    )

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className={cn("w-full justify-between", className)}
                    disabled={disabled}
                >
                    <span className="truncate">
                        {inputValue || placeholder}
                    </span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0" align="start">
                <Command>
                    <CommandInput
                        placeholder={searchPlaceholder}
                        value={inputValue}
                        onValueChange={handleInputChange}
                    />
                    <CommandList>
                        <CommandEmpty>{emptyMessage}</CommandEmpty>
                        <CommandGroup>
                            {inputValue && !options.includes(inputValue) && (
                                <CommandItem
                                    value={inputValue}
                                    onSelect={() => handleSelect(inputValue)}
                                >
                                    <Check className="mr-2 h-4 w-4 opacity-0" />
                                    <span className="font-medium">Use: &quot;{inputValue}&quot;</span>
                                </CommandItem>
                            )}
                            {filteredOptions.map((option) => (
                                <CommandItem
                                    key={option}
                                    value={option}
                                    onSelect={() => handleSelect(option)}
                                >
                                    <Check
                                        className={cn(
                                            "mr-2 h-4 w-4",
                                            value === option ? "opacity-100" : "opacity-0"
                                        )}
                                    />
                                    {option}
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    )
}
