"use client"

import { useActionState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"

import { loginAction, type AuthActionState } from "@/actions/user"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"

const loginFormSchema = z.object({
  email: z.string().email("Email tidak valid"),
  password: z.string().min(1, "Password wajib diisi"),
})

type LoginFormValues = z.infer<typeof loginFormSchema>
const initialAuthState: AuthActionState = { message: null }

export function LoginForm() {
  const [state, formAction, isPending] = useActionState(loginAction, initialAuthState)

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  })

  return (
    <Form {...form}>
      <form action={formAction} className="space-y-4">
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
                  placeholder="********"
                  autoComplete="current-password"
                  {...field}
                />
              </FormControl>
              <FormMessage>{state.fieldErrors?.password?.[0]}</FormMessage>
            </FormItem>
          )}
        />
        {state.message && <p className="text-sm text-destructive">{state.message}</p>}
        <Button className="w-full" type="submit" disabled={isPending}>
          {isPending ? "Memproses..." : "Masuk"}
        </Button>
      </form>
    </Form>
  )
}
