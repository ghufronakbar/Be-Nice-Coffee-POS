"use client"

import { useActionState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"

import { firstTimeSetupAction, type AuthActionState } from "@/actions/user"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"

const firstTimeSetupSchema = z
  .object({
    name: z.string().min(3, "Nama minimal 3 karakter"),
    email: z.string().email("Email tidak valid"),
    password: z.string().min(8, "Password minimal 8 karakter"),
    confirmPassword: z.string().min(8, "Konfirmasi password minimal 8 karakter"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "Konfirmasi password tidak sama",
  })

type FirstTimeSetupValues = z.infer<typeof firstTimeSetupSchema>
const initialAuthState: AuthActionState = { message: null }

export function FirstTimeSetupForm() {
  const [state, formAction, isPending] = useActionState(firstTimeSetupAction, initialAuthState)

  const form = useForm<FirstTimeSetupValues>({
    resolver: zodResolver(firstTimeSetupSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  })

  return (
    <Form {...form}>
      <form action={formAction} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nama</FormLabel>
              <FormControl>
                <Input type="text" placeholder="Nama owner" autoComplete="name" {...field} />
              </FormControl>
              <FormMessage>{state.fieldErrors?.name?.[0]}</FormMessage>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" placeholder="nama@email.com" autoComplete="email" {...field} />
              </FormControl>
              <FormMessage>{state.fieldErrors?.email?.[0]}</FormMessage>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <Input
                  type="password"
                  placeholder="Minimal 8 karakter"
                  autoComplete="new-password"
                  {...field}
                />
              </FormControl>
              <FormMessage>{state.fieldErrors?.password?.[0]}</FormMessage>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="confirmPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Konfirmasi Password</FormLabel>
              <FormControl>
                <Input
                  type="password"
                  placeholder="Ulangi password"
                  autoComplete="new-password"
                  {...field}
                />
              </FormControl>
              <FormMessage>{state.fieldErrors?.confirmPassword?.[0]}</FormMessage>
            </FormItem>
          )}
        />
        {state.message && <p className="text-sm text-destructive">{state.message}</p>}
        <Button className="w-full" type="submit" disabled={isPending}>
          {isPending ? "Memproses..." : "Buat Akun Pertama"}
        </Button>
      </form>
    </Form>
  )
}
