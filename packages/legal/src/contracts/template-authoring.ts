export type ContractTemplateVariableType =
  | "string"
  | "number"
  | "currency"
  | "date"
  | "datetime"
  | "boolean"
  | "email"
  | "phone"
  | "url"

export interface ContractTemplateVariableDefinition {
  key: string
  label: string
  example: string
  type: ContractTemplateVariableType
  description?: string
  deprecated?: boolean
}

export interface ContractTemplateVariableCategory {
  id: string
  label: string
  description?: string
  variables: ContractTemplateVariableDefinition[]
}

export interface ContractTemplateLiquidSnippet {
  id: string
  label: string
  description: string
  code: string
}

export const contractTemplateVariableCatalog: ContractTemplateVariableCategory[] = [
  {
    id: "operator",
    label: "Operator",
    variables: [
      {
        key: "operator.name",
        label: "Operator name",
        example: "Voyant Travel",
        type: "string",
      },
      {
        key: "operator.email",
        label: "Operator email",
        example: "sales@voyant.travel",
        type: "email",
      },
      {
        key: "operator.phone",
        label: "Operator phone",
        example: "+40 721 000 000",
        type: "phone",
      },
      {
        key: "operator.website",
        label: "Operator website",
        example: "https://voyant.travel",
        type: "url",
      },
      {
        key: "operator.address",
        label: "Operator address",
        example: "1 Example Street, Bucharest",
        type: "string",
      },
    ],
  },
  {
    id: "customer",
    label: "Customer",
    variables: [
      {
        key: "customer.name",
        label: "Full name",
        example: "Arthur Silva",
        type: "string",
      },
      {
        key: "customer.first_name",
        label: "First name",
        example: "Arthur",
        type: "string",
      },
      {
        key: "customer.last_name",
        label: "Last name",
        example: "Silva",
        type: "string",
      },
      {
        key: "customer.email",
        label: "Email",
        example: "arthur.silva@example.com",
        type: "email",
      },
      {
        key: "customer.phone",
        label: "Phone",
        example: "+40 721 111 222",
        type: "phone",
      },
      {
        key: "customer.primary_address.line1",
        label: "Primary address line 1",
        example: "19 Example Street",
        type: "string",
      },
      {
        key: "customer.primary_address.city",
        label: "Primary city",
        example: "Paris",
        type: "string",
      },
      {
        key: "customer.primary_address.country",
        label: "Primary country",
        example: "France",
        type: "string",
      },
    ],
  },
  {
    id: "booking",
    label: "Booking",
    variables: [
      {
        key: "booking.reference",
        label: "Reference",
        example: "BKG-2026-00125",
        type: "string",
      },
      {
        key: "booking.status",
        label: "Status",
        example: "confirmed",
        type: "string",
      },
      {
        key: "booking.start_date",
        label: "Start date",
        example: "2026-06-15",
        type: "date",
      },
      {
        key: "booking.end_date",
        label: "End date",
        example: "2026-06-22",
        type: "date",
      },
      {
        key: "booking.total",
        label: "Total amount",
        example: "2499.00",
        type: "currency",
      },
      {
        key: "booking.currency",
        label: "Currency",
        example: "EUR",
        type: "string",
      },
      {
        key: "booking.deposit_amount",
        label: "Deposit amount",
        example: "500.00",
        type: "currency",
      },
      {
        key: "booking.balance_amount",
        label: "Balance amount",
        example: "1999.00",
        type: "currency",
      },
      {
        key: "booking.travelers_count",
        label: "Travelers count",
        example: "2",
        type: "number",
      },
      {
        key: "booking.rooms_summary",
        label: "Rooms summary",
        example: "1x Double Room",
        type: "string",
      },
    ],
  },
  {
    id: "contract",
    label: "Contract",
    variables: [
      {
        key: "contract.number",
        label: "Contract number",
        example: "CTR-2026-0042",
        type: "string",
      },
      {
        key: "contract.issued_at",
        label: "Issued at",
        example: "2026-04-21T10:00:00Z",
        type: "datetime",
      },
      {
        key: "contract.expires_at",
        label: "Expires at",
        example: "2026-05-01T23:59:59Z",
        type: "datetime",
      },
      {
        key: "contract.signed_at",
        label: "Signed at",
        example: "2026-04-22T08:30:00Z",
        type: "datetime",
      },
      {
        key: "contract.status",
        label: "Status",
        example: "issued",
        type: "string",
      },
    ],
  },
  {
    id: "traveler-loop",
    label: "Traveler loop item",
    description: "Use these inside a Liquid loop such as `{% for traveler in travelers %}`.",
    variables: [
      {
        key: "traveler.full_name",
        label: "Traveler full name",
        example: "Jane Doe",
        type: "string",
      },
      {
        key: "traveler.first_name",
        label: "Traveler first name",
        example: "Jane",
        type: "string",
      },
      {
        key: "traveler.last_name",
        label: "Traveler last name",
        example: "Doe",
        type: "string",
      },
      {
        key: "traveler.date_of_birth",
        label: "Traveler date of birth",
        example: "1990-08-10",
        type: "date",
      },
      {
        key: "traveler.document_number",
        label: "Traveler document number",
        example: "AB123456",
        type: "string",
      },
      {
        key: "traveler.nationality",
        label: "Traveler nationality",
        example: "RO",
        type: "string",
      },
    ],
  },
  {
    id: "system",
    label: "System",
    variables: [
      {
        key: "now.date",
        label: "Current date",
        example: "2026-04-21",
        type: "date",
      },
      {
        key: "now.datetime",
        label: "Current date & time",
        example: "2026-04-21T12:30:00Z",
        type: "datetime",
      },
    ],
  },
]

export const contractTemplateLiquidSnippets: ContractTemplateLiquidSnippet[] = [
  {
    id: "simple-variable",
    label: "Simple variable",
    description: "Output a single value from the render context.",
    code: "{{ booking.reference }}",
  },
  {
    id: "default-value",
    label: "Default value",
    description: "Fallback when a variable is missing or blank.",
    code: '{{ customer.phone | default: "N/A" }}',
  },
  {
    id: "money-line",
    label: "Amount line",
    description: "Render an amount together with its currency.",
    code: "{{ booking.total }} {{ booking.currency }}",
  },
  {
    id: "if-block",
    label: "Conditional block",
    description: "Show content only when a condition is met.",
    code: `{% if booking.deposit_amount %}
Deposit due today: {{ booking.deposit_amount }} {{ booking.currency }}
{% endif %}`,
  },
  {
    id: "traveler-loop",
    label: "Traveler loop",
    description: "Repeat content for each traveler in the booking.",
    code: `{% for traveler in travelers %}
{{ forloop.index }}. {{ traveler.full_name }}{% if traveler.date_of_birth %} — {{ traveler.date_of_birth }}{% endif %}
{% endfor %}`,
  },
]
