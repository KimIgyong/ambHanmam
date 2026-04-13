import { useState } from 'react';
import { toast } from 'sonner';
import {
  Globe,
  Search,
  ChevronLeft,
  ChevronRight,
  UserPlus,
  Unlink,
  Loader2,
  X,
  CheckCircle2,
  XCircle,
  Plus,
} from 'lucide-react';
import { useEntityList, useCreateEntity } from '@/domain/settings/hooks/useEntities';
import {
  usePortalCustomers,
  usePortalMappings,
  useCreateInternalAccount,
  useRevokeMapping,
} from '../hooks/usePortalBridge';
import type { PortalCustomerItem } from '../service/portal-bridge.service';

type Tab = 'customers' | 'mappings';
type MappingFilter = 'all' | 'mapped' | 'unmapped';
type Role = 'MASTER' | 'MANAGER' | 'MEMBER' | 'VIEWER';

const ROLES: Role[] = ['MASTER', 'MANAGER', 'MEMBER', 'VIEWER'];

export default function PortalCustomerPage() {
  const [activeTab, setActiveTab] = useState<Tab>('customers');

  // --- Customers tab state ---
  const [search, setSearch] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [mappingFilter, setMappingFilter] = useState<MappingFilter>('all');
  const [page, setPage] = useState(1);
  const limit = 20;

  // --- Mappings tab state ---
  const [mappingPage, setMappingPage] = useState(1);

  // --- Modal state ---
  const [modalCustomer, setModalCustomer] = useState<PortalCustomerItem | null>(null);

  const customersQuery = usePortalCustomers({
    search: appliedSearch || undefined,
    mapping_filter: mappingFilter === 'all' ? undefined : mappingFilter,
    page,
    limit,
  });

  const mappingsQuery = usePortalMappings(mappingPage, limit);

  const handleSearch = () => {
    setAppliedSearch(search);
    setPage(1);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch();
  };

  return (
    <div className="mx-auto max-w-6xl overflow-y-auto h-full p-6">
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100">
          <Globe className="h-5 w-5 text-emerald-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Portal Customer Management</h1>
          <p className="text-sm text-gray-500">
            Manage portal customers and link them to internal accounts
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-4 flex gap-1 rounded-lg bg-gray-100 p-1">
        <button
          onClick={() => setActiveTab('customers')}
          className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === 'customers'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Customers
        </button>
        <button
          onClick={() => setActiveTab('mappings')}
          className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === 'mappings'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Mappings
        </button>
      </div>

      {activeTab === 'customers' && (
        <CustomersTab
          search={search}
          setSearch={setSearch}
          mappingFilter={mappingFilter}
          setMappingFilter={setMappingFilter}
          onSearch={handleSearch}
          onKeyDown={handleKeyDown}
          query={customersQuery}
          page={page}
          setPage={setPage}
          onCreateAccount={setModalCustomer}
        />
      )}

      {activeTab === 'mappings' && (
        <MappingsTab
          query={mappingsQuery}
          page={mappingPage}
          setPage={setMappingPage}
        />
      )}

      {modalCustomer && (
        <CreateAccountModal
          customer={modalCustomer}
          onClose={() => setModalCustomer(null)}
        />
      )}
    </div>
  );
}

// ============================
// Customers Tab
// ============================

function CustomersTab({
  search,
  setSearch,
  mappingFilter,
  setMappingFilter,
  onSearch,
  onKeyDown,
  query,
  page,
  setPage,
  onCreateAccount,
}: {
  search: string;
  setSearch: (v: string) => void;
  mappingFilter: MappingFilter;
  setMappingFilter: (v: MappingFilter) => void;
  onSearch: () => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  query: ReturnType<typeof usePortalCustomers>;
  page: number;
  setPage: (p: number) => void;
  onCreateAccount: (c: PortalCustomerItem) => void;
}) {
  return (
    <>
      {/* Filters */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, email, or company..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={onKeyDown}
            className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>
        <select
          value={mappingFilter}
          onChange={(e) => {
            setMappingFilter(e.target.value as MappingFilter);
            setPage(1);
          }}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
        >
          <option value="all">All</option>
          <option value="mapped">Mapped</option>
          <option value="unmapped">Unmapped</option>
        </select>
        <button
          onClick={onSearch}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          Search
        </button>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        {query.isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
          </div>
        ) : query.isError ? (
          <div className="py-16 text-center text-sm text-red-500">
            Failed to load customers
          </div>
        ) : !query.data?.items.length ? (
          <div className="py-16 text-center">
            <Globe className="mx-auto mb-3 h-10 w-10 text-gray-300" />
            <p className="text-sm text-gray-400">No customers found</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-gray-200 bg-gray-50 text-xs uppercase text-gray-500">
                  <tr>
                    <th className="px-4 py-3">Name</th>
                    <th className="px-4 py-3">Email</th>
                    <th className="px-4 py-3">Company</th>
                    <th className="px-4 py-3">Country</th>
                    <th className="px-4 py-3 text-center">Verified</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Registered</th>
                    <th className="px-4 py-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {query.data.items.map((c) => (
                    <tr key={c.pctId} className="hover:bg-gray-50">
                      <td className="whitespace-nowrap px-4 py-3 font-medium text-gray-900">
                        {c.pctName}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-gray-600">
                        {c.pctEmail}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-gray-600">
                        {c.pctCompanyName || '-'}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-gray-600">
                        {c.pctCountry || '-'}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {c.pctEmailVerified ? (
                          <CheckCircle2 className="mx-auto h-4 w-4 text-emerald-500" />
                        ) : (
                          <XCircle className="mx-auto h-4 w-4 text-gray-300" />
                        )}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        {c.isMapped ? (
                          <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
                            Mapped
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-500">
                            Unmapped
                          </span>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-gray-500">
                        {new Date(c.pctCreatedAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {!c.isMapped && (
                          <button
                            onClick={() => onCreateAccount(c)}
                            className="inline-flex items-center gap-1 rounded-md border border-indigo-300 bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-700 hover:bg-indigo-100"
                          >
                            <UserPlus className="h-3.5 w-3.5" />
                            Create Account
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <Pagination
              page={page}
              totalPages={query.data.totalPages}
              total={query.data.total}
              onPageChange={setPage}
            />
          </>
        )}
      </div>
    </>
  );
}

// ============================
// Mappings Tab
// ============================

function MappingsTab({
  query,
  page,
  setPage,
}: {
  query: ReturnType<typeof usePortalMappings>;
  page: number;
  setPage: (p: number) => void;
}) {
  const revokeMutation = useRevokeMapping();

  const handleRevoke = (pumId: string) => {
    if (!confirm('Are you sure you want to revoke this mapping?')) return;
    revokeMutation.mutate(pumId, {
      onSuccess: () => toast.success('Mapping revoked'),
      onError: () => toast.error('Failed to revoke mapping'),
    });
  };

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
      {query.isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
        </div>
      ) : query.isError ? (
        <div className="py-16 text-center text-sm text-red-500">
          Failed to load mappings
        </div>
      ) : !query.data?.items.length ? (
        <div className="py-16 text-center">
          <Unlink className="mx-auto mb-3 h-10 w-10 text-gray-300" />
          <p className="text-sm text-gray-400">No mappings found</p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-gray-200 bg-gray-50 text-xs uppercase text-gray-500">
                <tr>
                  <th className="px-4 py-3">Portal Customer</th>
                  <th className="px-4 py-3">Portal Email</th>
                  <th className="px-4 py-3">Internal User</th>
                  <th className="px-4 py-3">Internal Email</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Created</th>
                  <th className="px-4 py-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {query.data.items.map((m) => (
                  <tr key={m.pumId} className="hover:bg-gray-50">
                    <td className="whitespace-nowrap px-4 py-3 font-medium text-gray-900">
                      {m.portalCustomer.pctName}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-gray-600">
                      {m.portalCustomer.pctEmail}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-gray-900">
                      {m.user.usrName}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-gray-600">
                      {m.user.usrEmail}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
                        {m.user.usrRole}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                          m.pumStatus === 'ACTIVE'
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-red-50 text-red-600'
                        }`}
                      >
                        {m.pumStatus}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-gray-500">
                      {new Date(m.pumCreatedAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {m.pumStatus === 'ACTIVE' && (
                        <button
                          onClick={() => handleRevoke(m.pumId)}
                          disabled={revokeMutation.isPending}
                          className="inline-flex items-center gap-1 rounded-md border border-red-300 bg-red-50 px-2.5 py-1 text-xs font-medium text-red-700 hover:bg-red-100 disabled:opacity-50"
                        >
                          <Unlink className="h-3.5 w-3.5" />
                          Revoke
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Pagination
            page={page}
            totalPages={query.data.totalPages}
            total={query.data.total}
            onPageChange={setPage}
          />
        </>
      )}
    </div>
  );
}

// ============================
// CreateAccountModal
// ============================

type EntityMode = 'select' | 'create';

const COUNTRY_CURRENCY: Record<string, string> = { KR: 'KRW', VN: 'VND' };
const CURRENCIES = ['KRW', 'VND', 'USD'];
const COUNTRIES: { value: string; label: string }[] = [
  { value: 'VN', label: 'Vietnam' },
  { value: 'KR', label: 'Korea' },
];

function generateEntityCode(companyName: string): string {
  const letters = companyName.replace(/[^a-zA-Z]/g, '').toUpperCase().slice(0, 5);
  const suffix = String(Math.floor(Math.random() * 900) + 100);
  return (letters || 'ENT') + suffix;
}

function mapPortalCountry(pctCountry: string | null): string {
  if (pctCountry?.toUpperCase() === 'KR' || pctCountry?.toUpperCase() === 'KOREA') return 'KR';
  return 'VN';
}

function CreateAccountModal({
  customer,
  onClose,
}: {
  customer: PortalCustomerItem;
  onClose: () => void;
}) {
  const { data: entities } = useEntityList();
  const createMutation = useCreateInternalAccount();
  const createEntityMutation = useCreateEntity();

  // Mode
  const [entityMode, setEntityMode] = useState<EntityMode>('select');

  // Select existing
  const [entityId, setEntityId] = useState('');

  // Create new entity
  const initialCountry = mapPortalCountry(customer.pctCountry);
  const [companyName, setCompanyName] = useState(customer.pctCompanyName || '');
  const [entityCode, setEntityCode] = useState(() =>
    generateEntityCode(customer.pctCompanyName || ''),
  );
  const [country, setCountry] = useState(initialCountry);
  const [currency, setCurrency] = useState(COUNTRY_CURRENCY[initialCountry] || 'USD');

  // Role
  const [role, setRole] = useState<Role>(entityMode === 'create' ? 'MASTER' : 'MEMBER');

  const [submitting, setSubmitting] = useState(false);

  const handleModeChange = (mode: EntityMode) => {
    setEntityMode(mode);
    if (mode === 'create') {
      setRole('MASTER');
    }
  };

  const handleCountryChange = (c: string) => {
    setCountry(c);
    setCurrency(COUNTRY_CURRENCY[c] || 'USD');
  };

  const handleSubmit = async () => {
    if (entityMode === 'select') {
      if (!entityId) {
        toast.error('Please select an entity');
        return;
      }
      createMutation.mutate(
        { pctId: customer.pctId, data: { entity_id: entityId, role } },
        {
          onSuccess: (result) => {
            toast.success(`Account created for ${result.name} (${result.email})`);
            onClose();
          },
          onError: (err: unknown) => {
            const message =
              (err as { response?: { data?: { error?: string } } })?.response?.data?.error ||
              'Failed to create account';
            toast.error(message);
          },
        },
      );
    } else {
      // Create new entity first, then create account
      if (!companyName.trim()) {
        toast.error('Company name is required');
        return;
      }
      if (!entityCode.trim()) {
        toast.error('Entity code is required');
        return;
      }

      setSubmitting(true);
      try {
        const newEntity = await createEntityMutation.mutateAsync({
          code: entityCode.trim(),
          name: companyName.trim(),
          country,
          currency,
        });

        createMutation.mutate(
          {
            pctId: customer.pctId,
            data: { entity_id: newEntity.entityId, role: 'MASTER' },
          },
          {
            onSuccess: (result) => {
              toast.success(`Entity "${companyName}" created and account created for ${result.name}`);
              onClose();
            },
            onError: (err: unknown) => {
              const message =
                (err as { response?: { data?: { error?: string } } })?.response?.data?.error ||
                'Entity created but failed to create account';
              toast.error(message);
            },
            onSettled: () => setSubmitting(false),
          },
        );
      } catch (err: unknown) {
        const message =
          (err as { response?: { data?: { error?: string } } })?.response?.data?.error ||
          'Failed to create entity';
        toast.error(message);
        setSubmitting(false);
      }
    }
  };

  const isSubmitting = submitting || createMutation.isPending;
  const isDisabled =
    isSubmitting ||
    (entityMode === 'select' && !entityId) ||
    (entityMode === 'create' && (!companyName.trim() || !entityCode.trim()));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-md rounded-xl bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
          <h3 className="text-base font-semibold text-gray-900">Create Internal Account</h3>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4 px-5 py-4">
          {/* Customer info */}
          <div className="rounded-lg bg-gray-50 p-3">
            <p className="text-xs font-medium uppercase text-gray-400">Portal Customer</p>
            <p className="mt-1 font-medium text-gray-900">{customer.pctName}</p>
            <p className="text-sm text-gray-500">{customer.pctEmail}</p>
            {customer.pctCompanyName && (
              <p className="text-sm text-gray-500">{customer.pctCompanyName}</p>
            )}
          </div>

          {/* Entity mode toggle */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Entity <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-1 rounded-lg bg-gray-100 p-1">
              <button
                type="button"
                onClick={() => handleModeChange('select')}
                className={`flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                  entityMode === 'select'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Select Existing
              </button>
              <button
                type="button"
                onClick={() => handleModeChange('create')}
                className={`flex-1 inline-flex items-center justify-center gap-1 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                  entityMode === 'create'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <Plus className="h-3 w-3" />
                Create New
              </button>
            </div>
          </div>

          {/* Select existing entity */}
          {entityMode === 'select' && (
            <select
              value={entityId}
              onChange={(e) => setEntityId(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="">Select entity...</option>
              {entities?.map((e) => (
                <option key={e.entityId} value={e.entityId}>
                  {e.name}
                </option>
              ))}
            </select>
          )}

          {/* Create new entity form */}
          {entityMode === 'create' && (
            <div className="space-y-3 rounded-lg border border-gray-200 bg-gray-50/50 p-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">
                  Company Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="e.g. ABC Vietnam Co., Ltd"
                  className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">
                  Entity Code <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={entityCode}
                  onChange={(e) => setEntityCode(e.target.value.toUpperCase())}
                  maxLength={10}
                  placeholder="e.g. ABCVN"
                  className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-mono focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-600">
                    Country <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={country}
                    onChange={(e) => handleCountryChange(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    {COUNTRIES.map((c) => (
                      <option key={c.value} value={c.value}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-600">
                    Currency <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    {CURRENCIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Role */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Role</label>
            {entityMode === 'create' ? (
              <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
                <span className="text-sm font-medium text-gray-700">MASTER</span>
                <span className="text-xs text-gray-400">(fixed for new entity)</span>
              </div>
            ) : (
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as Role)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                {ROLES.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 border-t border-gray-200 px-5 py-4">
          <button
            onClick={onClose}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isDisabled}
            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
            Create Account
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================
// Pagination
// ============================

function Pagination({
  page,
  totalPages,
  total,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  total: number;
  onPageChange: (p: number) => void;
}) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between border-t border-gray-200 px-4 py-3">
      <p className="text-xs text-gray-500">
        Total <span className="font-medium">{total}</span> records
      </p>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 disabled:opacity-30"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span className="px-2 text-xs text-gray-600">
          {page} / {totalPages}
        </span>
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 disabled:opacity-30"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
