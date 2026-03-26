import { createSlide, createDeck } from '../schema/slide-schema.js';

const qbrDeck = createDeck({
  title: 'Quarterly Business Review',
  author: 'Rewst Team',
  theme: 'rewst',
  slides: [
    createSlide('title', {
      title: 'Quarterly Business Review',
      subtitle: 'Automation outcomes and service performance for MSP leadership',
      author: 'Rewst Team',
      date: 'Q1 2026',
      theme: 'rewst',
    }),
    createSlide('content', {
      title: 'Executive Summary',
      subtitle: 'Quarterly performance at a glance',
      icon: 'TrendingUp',
      theme: 'highlight',
      points: [
        'Expanded automated service delivery across core MSP workflows and client environments.',
        'Reduced manual technician effort on recurring operational tasks with higher process consistency.',
        'Improved visibility into outcomes, escalations, and SLA-sensitive service events.',
      ],
    }),
    createSlide('metric', {
      title: 'Key Metrics',
      subtitle: 'Quarter-over-quarter operational results',
      theme: 'rewst',
      metrics: [
        { value: '42%', label: 'Tickets auto-resolved', color: 'text-bot-teal-400' },
        { value: '18 hrs', label: 'Weekly labor saved', color: 'text-trigger-amber-400' },
        { value: '99.2%', label: 'Workflow success rate', color: 'text-alert-coral-400' },
      ],
    }),
    createSlide('content', {
      title: 'Service Delivery Highlights',
      subtitle: 'What improved for the MSP operations team',
      icon: 'ShieldCheck',
      theme: 'terminal',
      points: [
        'Standardized alert triage and technician assignment with policy-driven automation.',
        'Accelerated user lifecycle tasks such as onboarding, offboarding, and access cleanup.',
        'Improved client reporting cadence with repeatable data collection and distribution workflows.',
      ],
    }),
    createSlide('grid', {
      title: 'Automation ROI',
      subtitle: 'Business impact of deployed automations',
      columns: 3,
      theme: 'rewst',
      items: [
        {
          title: 'Labor Efficiency',
          description: 'Freed technician capacity for project work by automating routine service tasks.',
          icon: 'Clock3',
        },
        {
          title: 'Consistency',
          description: 'Reduced variance in execution across patching, ticket updates, and account actions.',
          icon: 'Workflow',
        },
        {
          title: 'Scalability',
          description: 'Supported client growth without proportional increases in service desk workload.',
          icon: 'BarChart3',
        },
      ],
    }),
    createSlide('quote', {
      quote: 'Rewst helped us turn repeatable MSP work into a measurable operating advantage.',
      attribution: 'VP of Managed Services',
      role: 'Customer stakeholder',
      theme: 'dramatic',
    }),
    createSlide('content', {
      title: 'Areas for Improvement',
      subtitle: 'Focus areas identified this quarter',
      icon: 'AlertTriangle',
      theme: 'warning',
      points: [
        'Expand automation coverage for exception-heavy workflows that still rely on manual review.',
        'Tighten data quality in source systems to reduce avoidable workflow retries.',
        'Increase change-management documentation for newly automated processes.',
      ],
    }),
    createSlide('content', {
      title: 'Next Quarter Goals',
      subtitle: 'Planned priorities for continued maturity',
      icon: 'Target',
      theme: 'highlight',
      points: [
        'Launch additional security and compliance automations for managed clients.',
        'Increase executive reporting on automation usage, time savings, and service outcomes.',
        'Operationalize more self-healing actions tied to monitoring and ticket context.',
      ],
    }),
  ],
});

const securityDeck = createDeck({
  title: 'Security Assessment Summary',
  author: 'Rewst Security Team',
  theme: 'warning',
  slides: [
    createSlide('title', {
      title: 'Security Assessment Summary',
      subtitle: 'Risk posture and remediation priorities for MSP environments',
      author: 'Rewst Security Team',
      date: 'March 2026',
      theme: 'warning',
    }),
    createSlide('content', {
      title: 'Threat Landscape Overview',
      subtitle: 'Current pressures facing managed service providers',
      icon: 'Radar',
      theme: 'dramatic',
      points: [
        'Credential abuse and phishing remain the most common entry points across client estates.',
        'Attackers continue targeting remote access tools, identity platforms, and backup workflows.',
        'Automation can reduce response time by enforcing repeatable containment and escalation actions.',
      ],
    }),
    createSlide('metric', {
      title: 'Security Metrics',
      subtitle: 'Assessment findings and operational readiness',
      theme: 'warning',
      metrics: [
        { value: '11', label: 'Critical findings', color: 'text-alert-coral-400' },
        { value: '27 mins', label: 'Avg. triage time', color: 'text-trigger-amber-400' },
        { value: '86%', label: 'Automated control coverage', color: 'text-bot-teal-400' },
      ],
    }),
    createSlide('grid', {
      title: 'Vulnerabilities Found',
      subtitle: 'Highest-priority gaps discovered during review',
      columns: 3,
      theme: 'warning',
      items: [
        {
          title: 'Privileged Access Drift',
          description: 'Stale administrative access remained active longer than policy allows.',
          icon: 'KeyRound',
        },
        {
          title: 'Patch Exceptions',
          description: 'Several endpoints missed critical patch windows because approval workflows stalled.',
          icon: 'Bug',
        },
        {
          title: 'Alert Fatigue',
          description: 'High alert volume obscured escalation of a subset of high-severity events.',
          icon: 'BellRing',
        },
      ],
    }),
    createSlide('content', {
      title: 'Remediation Recommendations',
      subtitle: 'Near-term actions to reduce exposure',
      icon: 'Shield',
      theme: 'highlight',
      points: [
        'Automate privileged account reviews and disablement for inactive or noncompliant access.',
        'Enforce patch deadline workflows with clear exception ownership and executive reporting.',
        'Route high-fidelity detections into standardized Rewst response playbooks for faster containment.',
      ],
    }),
    createSlide('quote', {
      quote: 'The strongest security gains came from making our response process consistent, not just faster.',
      attribution: 'Security Operations Lead',
      role: 'Assessment team',
      theme: 'terminal',
    }),
  ],
});

const onboardingDeck = createDeck({
  title: 'Customer Onboarding',
  author: 'Rewst Customer Success',
  theme: 'rewst',
  slides: [
    createSlide('title', {
      title: 'Welcome to Rewst',
      subtitle: 'Customer onboarding plan for your MSP automation rollout',
      author: 'Rewst Customer Success',
      date: 'Launch Program',
      theme: 'rewst',
    }),
    createSlide('grid', {
      title: 'Onboarding Process Overview',
      subtitle: 'Milestones from kickoff to production use',
      columns: 3,
      theme: 'highlight',
      items: [
        {
          title: 'Discover',
          description: 'Align on business goals, target workflows, and success criteria.',
          icon: 'Search',
        },
        {
          title: 'Build',
          description: 'Configure integrations, map automations, and validate process design.',
          icon: 'Wrench',
        },
        {
          title: 'Launch',
          description: 'Enable production workflows, train users, and measure outcomes.',
          icon: 'Rocket',
        },
      ],
    }),
    createSlide('content', {
      title: 'Platform Capabilities',
      subtitle: 'What your team can automate with Rewst',
      icon: 'Layers3',
      theme: 'rewst',
      points: [
        'Automate cross-system MSP workflows spanning PSA, RMM, identity, and security tools.',
        'Standardize approvals, notifications, and technician handoffs with reusable logic.',
        'Improve operational reporting through centralized workflow visibility and outcomes data.',
      ],
    }),
    createSlide('content', {
      title: 'Integration Setup',
      subtitle: 'Core systems connected during onboarding',
      icon: 'PlugZap',
      theme: 'terminal',
      points: [
        'Connect PSA, RMM, documentation, and identity platforms used in daily service operations.',
        'Validate credentials, scopes, and tenancy boundaries for secure automated actions.',
        'Prioritize a first production workflow that demonstrates rapid, visible value.',
      ],
    }),
    createSlide('grid', {
      title: 'Training Schedule',
      subtitle: 'Enablement plan for admins and operators',
      columns: 2,
      theme: 'rewst',
      items: [
        {
          title: 'Week 1: Foundations',
          description: 'Platform navigation, core concepts, and workflow lifecycle overview.',
          icon: 'BookOpen',
        },
        {
          title: 'Week 2: Builder Lab',
          description: 'Hands-on workflow configuration for common MSP use cases.',
          icon: 'FlaskConical',
        },
        {
          title: 'Week 3: Operations',
          description: 'Monitoring, exception handling, and reporting best practices.',
          icon: 'MonitorCog',
        },
        {
          title: 'Week 4: Optimization',
          description: 'Governance, scaling patterns, and automation roadmap planning.',
          icon: 'TrendingUp',
        },
      ],
    }),
    createSlide('metric', {
      title: 'Success Metrics',
      subtitle: 'Targets for a strong onboarding outcome',
      theme: 'highlight',
      metrics: [
        { value: '3', label: 'Production workflows', color: 'text-bot-teal-400' },
        { value: '2 weeks', label: 'Time to first value', color: 'text-trigger-amber-400' },
        { value: '90%+', label: 'Admin training completion', color: 'text-alert-coral-400' },
      ],
    }),
    createSlide('section', {
      title: 'Getting Started',
      subtitle: 'Kickoff, connector access, and first workflow selection',
      theme: 'dramatic',
    }),
  ],
});

const demoDeck = createDeck({
  title: 'Product Demo / Feature Overview',
  author: 'Rewst Solutions Engineering',
  theme: 'rewst',
  slides: [
    createSlide('title', {
      title: 'Product Demo / Feature Overview',
      subtitle: 'How Rewst helps MSPs scale service delivery through automation',
      author: 'Rewst Solutions Engineering',
      date: 'Live Demo',
      theme: 'rewst',
    }),
    createSlide('content', {
      title: 'Platform Overview',
      subtitle: 'A purpose-built automation platform for MSP teams',
      icon: 'MonitorSmartphone',
      theme: 'rewst',
      points: [
        'Centralizes MSP workflow automation across service desk, identity, compliance, and operations.',
        'Combines orchestration, reusable logic, approvals, and reporting in one operating layer.',
        'Supports scalable automation without sacrificing process control or technician oversight.',
      ],
    }),
    createSlide('grid', {
      title: 'Automation Engine',
      subtitle: 'Core capabilities that power workflow execution',
      columns: 3,
      theme: 'terminal',
      items: [
        {
          title: 'Triggers',
          description: 'Start automations from events, schedules, tickets, or user actions.',
          icon: 'PlayCircle',
        },
        {
          title: 'Logic',
          description: 'Apply conditions, routing, enrichment, and exception handling.',
          icon: 'GitBranch',
        },
        {
          title: 'Actions',
          description: 'Execute tasks across connected systems with auditability and consistency.',
          icon: 'Zap',
        },
      ],
    }),
    createSlide('metric', {
      title: 'Key Metrics',
      subtitle: 'Outcomes customers care about most',
      theme: 'highlight',
      metrics: [
        { value: '<15 min', label: 'Time to first workflow', color: 'text-bot-teal-400' },
        { value: '100s', label: 'Potential automations', color: 'text-trigger-amber-400' },
        { value: '24/7', label: 'Operational consistency', color: 'text-alert-coral-400' },
      ],
    }),
    createSlide('grid', {
      title: 'Integration Ecosystem',
      subtitle: 'Systems commonly connected by MSP customers',
      columns: 3,
      theme: 'rewst',
      items: [
        {
          title: 'PSA & Ticketing',
          description: 'Coordinate service actions, approvals, and technician workflows.',
          icon: 'Tickets',
        },
        {
          title: 'RMM & Endpoint',
          description: 'Drive maintenance, patching, and remediation actions from device signals.',
          icon: 'Laptop',
        },
        {
          title: 'Identity & Security',
          description: 'Automate access governance, alerts, and response playbooks.',
          icon: 'ShieldCheck',
        },
      ],
    }),
    createSlide('quote', {
      quote: 'Rewst gave our MSP a way to operationalize best practices instead of relying on tribal knowledge.',
      attribution: 'Director of Operations',
      role: 'MSP customer',
      theme: 'dramatic',
    }),
    createSlide('section', {
      title: 'Live Demo',
      subtitle: 'From trigger to completed automated outcome',
      theme: 'terminal',
    }),
    createSlide('content', {
      title: 'Closing / Call to Action',
      subtitle: 'Recommended next steps after the demo',
      icon: 'ArrowRightCircle',
      theme: 'highlight',
      points: [
        'Identify one high-volume MSP process that is repetitive, manual, and measurable.',
        'Map the systems involved and the approvals or exceptions that matter most.',
        'Schedule a deeper workflow design session to validate business impact and rollout scope.',
      ],
    }),
  ],
});

const allHandsDeck = createDeck({
  title: 'Team Update / All-Hands',
  author: 'Rewst Leadership',
  theme: 'rewst',
  slides: [
    createSlide('title', {
      title: 'Team Update / All-Hands',
      subtitle: 'Progress, priorities, and momentum across the business',
      author: 'Rewst Leadership',
      date: 'March 2026',
      theme: 'rewst',
    }),
    createSlide('content', {
      title: 'Company Highlights',
      subtitle: 'What the team achieved this period',
      icon: 'Sparkles',
      theme: 'highlight',
      points: [
        'Expanded MSP customer adoption of core automation workflows and reporting capabilities.',
        'Released improvements that simplified workflow creation and operational visibility.',
        'Strengthened partnerships and enablement resources for customer success and sales teams.',
      ],
    }),
    createSlide('metric', {
      title: 'Team Metrics',
      subtitle: 'Shared scorecard for this update',
      theme: 'rewst',
      metrics: [
        { value: '94%', label: 'Customer retention', color: 'text-bot-teal-400' },
        { value: '12', label: 'New workflow releases', color: 'text-trigger-amber-400' },
        { value: '4.8/5', label: 'CSAT', color: 'text-alert-coral-400' },
      ],
    }),
    createSlide('grid', {
      title: 'Department Updates',
      subtitle: 'Cross-functional progress snapshot',
      columns: 3,
      theme: 'rewst',
      items: [
        {
          title: 'Product',
          description: 'Advanced builder usability and expanded reusable automation patterns.',
          icon: 'Blocks',
        },
        {
          title: 'Customer Success',
          description: 'Improved onboarding playbooks and expanded adoption coaching for MSP teams.',
          icon: 'Users',
        },
        {
          title: 'Engineering',
          description: 'Increased platform reliability and reduced turnaround on integration enhancements.',
          icon: 'Cpu',
        },
      ],
    }),
    createSlide('quote', {
      quote: 'Our biggest wins come from helping MSP teams do more of their best work with less friction.',
      attribution: 'Executive Leadership Team',
      role: 'All-hands message',
      theme: 'dramatic',
    }),
    createSlide('content', {
      title: "What's Next",
      subtitle: 'Priorities for the upcoming period',
      icon: 'Forward',
      theme: 'terminal',
      points: [
        'Double down on platform reliability, adoption, and measurable customer outcomes.',
        'Accelerate the roadmap for high-value MSP automation use cases and integrations.',
        'Invest in internal collaboration that helps teams execute with clarity and speed.',
      ],
    }),
  ],
});

export const TEMPLATES = [
  {
    id: 'qbr',
    name: 'QBR (Quarterly Business Review)',
    description: 'Eight-slide quarterly review deck focused on MSP automation outcomes, ROI, and next-quarter goals.',
    deck: qbrDeck,
  },
  {
    id: 'security',
    name: 'Security Assessment Summary',
    description: 'Six-slide security summary covering MSP threat landscape, findings, metrics, and remediation priorities.',
    deck: securityDeck,
  },
  {
    id: 'onboarding',
    name: 'Customer Onboarding',
    description: 'Seven-slide onboarding template for welcoming new MSP customers and guiding rollout milestones.',
    deck: onboardingDeck,
  },
  {
    id: 'demo',
    name: 'Product Demo / Feature Overview',
    description: 'Eight-slide demo deck that highlights Rewst capabilities, integrations, and next-step CTA.',
    deck: demoDeck,
  },
  {
    id: 'all-hands',
    name: 'Team Update / All-Hands',
    description: 'Six-slide internal update template for company highlights, metrics, department progress, and future focus.',
    deck: allHandsDeck,
  },
];

export function getTemplate(id) {
  return TEMPLATES.find(template => template.id === id) || null;
}
