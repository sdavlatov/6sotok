import config from '@payload-config'
import { RootLayout, handleServerFunctions } from '@payloadcms/next/layouts'
import React from 'react'
import type { ServerFunctionClient } from 'payload'
import { importMap } from './importMap'
import '@payloadcms/next/css'

const serverFunction: ServerFunctionClient = async (args) => {
  'use server'
  return handleServerFunctions({ ...args, config, importMap })
}

type Args = {
  children: React.ReactNode
}

const Layout = ({ children }: Args) =>
  RootLayout({
    children,
    config,
    importMap,
    serverFunction,
  })

export default Layout
