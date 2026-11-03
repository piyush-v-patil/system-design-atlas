import { p, q, type Comparison, type ProcessStep } from '../types.ts'

export const consistencySteps: Record<'weak' | 'eventual' | 'strong', ProcessStep[]> = {
  weak: [
    { caption: 'A client writes x = 2 to N1', source: q('After a write, reads may or may not see it.', 479) },
    { caption: 'Replication is best effort: N3 never receives the update', source: q('A best effort approach is taken.', 479) },
    {
      caption: 'A read from N3 returns the old value',
      source: q('For example, if you are on a phone call and lose reception for a few seconds, when you regain connection you do not hear what was spoken during connection loss.', 481),
    },
  ],
  eventual: [
    { caption: 'The write to N1 is acknowledged without waiting for the other copies', source: q('Data is replicated asynchronously.', 485) },
    { caption: 'A read from N3 right away can still return x = 1', source: p('Until replication reaches a copy, a read from that copy can return the old value', 485) },
    { caption: 'N2 and N3 catch up, typically within milliseconds', source: q('typically within milliseconds', 485) },
    { caption: 'Reads now return x = 2', source: q('After a write, reads will eventually see it', 485) },
  ],
  strong: [
    { caption: 'A client writes x = 2 to N1 and waits', source: q('After a write, reads will see it.', 491) },
    { caption: 'N1 replicates to N2 and N3 before answering', source: q('Data is replicated synchronously.', 491) },
    { caption: 'Only then is the write acknowledged', source: q('Strong consistency works well in systems that need transactions.', 493) },
    { caption: 'Any copy returns x = 2', source: q('After a write, reads will see it.', 491) },
  ],
}

export const consistencyChoose = {
  weak: q('Weak consistency works well in real time use cases such as VoIP, video chat, and realtime multiplayer games.', 481),
  eventual: q('Eventual consistency works well in highly available systems.', 487),
  strong: q('Strong consistency works well in systems that need transactions.', 493),
}

export const consistencyComparison: Comparison = {
  title: 'Weak vs eventual vs strong consistency',
  columns: [
    { key: 'weak', title: 'Weak', topicId: 'weak-consistency' },
    { key: 'eventual', title: 'Eventual', topicId: 'eventual-consistency' },
    { key: 'strong', title: 'Strong', topicId: 'strong-consistency' },
  ],
  rows: [
    {
      label: 'After a write',
      cells: {
        weak: q('After a write, reads may or may not see it.', 479),
        eventual: q('After a write, reads will eventually see it (typically within milliseconds).', 485),
        strong: q('After a write, reads will see it.', 491),
      },
    },
    {
      label: 'Replication',
      cells: { weak: q('A best effort approach is taken.', 479), eventual: q('Data is replicated asynchronously.', 485), strong: q('Data is replicated synchronously.', 491) },
    },
    {
      label: 'Seen in',
      cells: {
        weak: q('This approach is seen in systems such as memcached.', 481),
        eventual: q('This approach is seen in systems such as DNS and email.', 487),
        strong: q('This approach is seen in file systems and RDBMSes.', 493),
      },
    },
  ],
  chooseWhen: consistencyChoose,
}
