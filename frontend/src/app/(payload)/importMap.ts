import { CollectionCards, FolderField, FolderTableCell } from '@payloadcms/ui/rsc'
import { DocumentHeader, DefaultNav } from '@payloadcms/next/rsc'
import { RscEntryLexicalField } from '@payloadcms/richtext-lexical/rsc'

export const importMap = {
  '@payloadcms/ui/rsc#CollectionCards': CollectionCards,
  '@payloadcms/ui/rsc#FolderField': FolderField,
  '@payloadcms/ui/rsc#FolderTableCell': FolderTableCell,
  '@payloadcms/next/rsc#CollectionCards': CollectionCards,
  '@payloadcms/next/rsc#DocumentHeader': DocumentHeader,
  '@payloadcms/next/rsc#DefaultNav': DefaultNav,
  '@payloadcms/richtext-lexical/rsc#RscEntryLexicalField': RscEntryLexicalField,
}
