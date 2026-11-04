import { q, type Comparison, type ProcessStep } from '../types.ts'

const common: ProcessStep[] = [
  { caption: 'A network partition separates N1 and N2', source: q('Partition Tolerance - The system continues to operate despite arbitrary partitioning due to network failures', 452) },
  { caption: 'A write of x = 2 reaches N1 but cannot replicate to N2', source: q("Networks aren't reliable, so you'll need to support partition tolerance. You'll need to make a software tradeoff between consistency and availability.", 454) },
]

export const capSteps: Record<'CP' | 'AP', ProcessStep[]> = {
  CP: [
    ...common,
    { caption: 'A read sent to N2 waits on the partitioned node and times out', source: q('Waiting for a response from the partitioned node might result in a timeout error.', 458) },
    { caption: 'The reader gets an error, never a stale value', source: q('Consistency - Every read receives the most recent write or an error', 450) },
    { caption: 'CP fits systems that need atomic reads and writes', source: q('CP is a good choice if your business needs require atomic reads and writes.', 458) },
  ],
  AP: [
    ...common,
    { caption: 'N2 answers right away with the value it has: x = 1', source: q('Responses return the most readily available version of the data available on any node, which might not be the latest.', 462) },
    { caption: 'Every request got a response, but not the latest write', source: q('Availability - Every request receives a response, without guarantee that it contains the most recent version of the information', 451) },
    { caption: 'When the partition heals, the write propagates to N2', source: q('Writes might take some time to propagate when the partition is resolved.', 462) },
  ],
}

export const capChoose = {
  CP: q('CP is a good choice if your business needs require atomic reads and writes.', 458),
  AP: q('AP is a good choice if the business needs to allow for eventual consistency or when the system needs to continue working despite external errors.', 464),
}

export const capComparison: Comparison = {
  title: 'CP vs AP during a network partition',
  columns: [
    { key: 'CP', title: 'CP', topicId: 'cp---consistency-and-partition-tolerance' },
    { key: 'AP', title: 'AP', topicId: 'ap---availability-and-partition-tolerance' },
  ],
  rows: [
    { label: 'Keeps', cells: { CP: q('CP - consistency and partition tolerance', 456), AP: q('AP - availability and partition tolerance', 460) } },
    {
      label: 'A read during a partition',
      cells: {
        CP: q('Waiting for a response from the partitioned node might result in a timeout error.', 458),
        AP: q('Responses return the most readily available version of the data available on any node, which might not be the latest.', 462),
      },
    },
    { label: 'After the partition', cells: { CP: null, AP: q('Writes might take some time to propagate when the partition is resolved.', 462) } },
  ],
  chooseWhen: capChoose,
}
