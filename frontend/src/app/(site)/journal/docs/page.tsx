/* =========================================================================
   Центр знаний · уровень 2 — тема «Документы» (/journal/docs)
   1:1 порт макета «Дизайн html/Журнал знаний/journal-topic-documents.html»
   ========================================================================= */

import type { Metadata } from 'next';
import '../journal.css';
import { JournalBreadcrumbBar, JournalCta } from '../journal-ui';
import { TopicSections } from './topic-grid';

export const metadata: Metadata = {
  title: 'Документы — Центр знаний 6sotok.kz',
  description: 'Госакт, кадастр, доверенности и справки — всё, что нужно проверить и оформить при покупке, продаже и переводе земли.',
};

export default function JournalDocsPage() {
  return (
    <div className="journal">
      <JournalBreadcrumbBar trail={[
        { label: 'Центр знаний', href: '/journal' },
        { label: 'Документы' },
      ]} />
      <TopicSections />
      <JournalCta />
    </div>
  );
}
