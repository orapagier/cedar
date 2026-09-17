import React, { useState } from 'react';
import { 
  AlertTriangle, 
  ShieldAlert, 
  Filter, 
  Search, 
  PlusCircle, 
  CheckCircle2, 
  Clock, 
  User, 
  FileText,
  Lock,
  Download
} from 'lucide-react';
import { useDorm } from '../context/DormContext';
import { ViolationCategory, Violation } from '../types/dorm';

export const ViolationsDashboardView: React.FC = () => {
  const { violations, users, saveViolation, updateViolationStatus, canEdit, currentUser, isOccupant } = useDorm();
  const occupants = users.filter(u => u.role === 'occupant');

  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterSeverity, setFilterSeverity] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  // New Violation Form State
  const [selectedStudent, setSelectedStudent] = useState(occupants[0]?.id || '');
  const [category, setCategory] = useState<ViolationCategory>('curfew_breach');
  const [severity, setSeverity] = useState<'minor' | 'moderate' | 'major'>('minor');
  const [demerits, setDemerits] = useState(2);
  const [description, setDescription] = useState('');
  const [actionRequired, setActionRequired] = useState('');

  React.useEffect(() => {
    if ((!selectedStudent || !occupants.some(o => o.id === selectedStudent)) && occupants.length > 0) {
      setSelectedStudent(occupants[0].id);
    }
  }, [occupants, selectedStudent]);

  const filtered = violations.filter(v => {
    // If occupant, can view all or own? Occupants can view the public rule violations and their own status
    const matchesCat = filterCategory === 'all' || v.category === filterCategory;
    const matchesSev = filterSeverity === 'all' || v.severity === filterSeverity;
    const matchesSearch = 
      v.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.roomNumber.includes(searchTerm) ||
      v.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCat && matchesSev && matchesSearch;
  });

  const handleCreateViolation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit) return;
    const student = occupants.find(o => o.id === selectedStudent);
    if (!student) return;

    saveViolation({
      date: new Date().toISOString().split('T')[0],
      studentId: student.id,
      studentName: student.name,
      roomNumber: student.roomNumber || '101',
      category,
      severity,
      description,
      demeritPoints: Number(demerits),
      reportedBy: currentUser.name,
      status: 'pending_settlement',
      actionRequired: actionRequired || undefined,
    });

    setShowAddModal(false);
    setDescription('');
    setActionRequired('');
  };

  const handleExportCSV = () => {
    const headers = ['Date', 'Time', 'Student', 'Room', 'Category', 'Severity', 'Demerits', 'Status', 'Description', 'ReportedBy'];
    const rows = filtered.map(v => [
      v.date,
      v.createdAt,
      `"${v.studentName}"`,
      v.roomNumber,
      v.category,
      v.severity,
      v.demeritPoints,
      v.status,
      `"${v.description.replace(/"/g, '""')}"`,
      `"${v.reportedBy}"`
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `dorm_violations_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-4 sm:p-5 rounded-2xl">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-lg font-bold text-white">Real-Time Rule Violations & Demerit Ledger</h2>
            <span className="text-xs bg-rose-500/20 text-rose-300 border border-rose-500/30 px-2 py-0.5 rounded-full font-medium">
              Central Discipline Stream
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Real-time tracking of infractions across all 12 dorm policies with automated demerits and service clearance.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleExportCSV}
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-2 min-h-touch rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-colors border border-slate-700"
            title="Download CSV Report"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Export CSV</span>
          </button>

          {canEdit ? (
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-rose-600 hover:bg-rose-500 text-white font-bold px-4 py-2 min-h-touch rounded-xl text-xs flex items-center space-x-2 transition-all shadow-md"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Log Incident / Violation</span>
            </button>
          ) : (
            <div className="bg-slate-800 border border-slate-700 text-slate-400 text-xs px-3 py-1.5 rounded-lg flex items-center space-x-1.5">
              <Lock className="w-3.5 h-3.5" />
              <span>Occupant View-Only</span>
            </div>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center space-x-1.5 text-slate-400">
            <Filter className="w-3.5 h-3.5" />
            <span>Category:</span>
          </div>
          <select
            value={filterCategory}
            onChange={e => setFilterCategory(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-2 min-h-touch text-white"
          >
            <option value="all">All 12 Policies</option>
            <option value="cleanliness">Room & CR Cleanliness</option>
            <option value="worship_absence">Worship Absence</option>
            <option value="worship_late">Worship Late</option>
            <option value="no_bible">No Bible at Worship</option>
            <option value="curfew_breach">Curfew Breach (Past 9 PM)</option>
            <option value="uniform_violation">School Uniform & Haircut</option>
            <option value="irregular_school_departure">Irregular School Departure</option>
            <option value="church_absence">Church Service Absence</option>
            <option value="study_hour_skipping">Study Hours Skipping</option>
            <option value="chore_neglect">Chore Neglect</option>
            <option value="lights_out_violation">Lights-Out Violation (10 PM)</option>
            <option value="cellphone_policy_breach">Cellphone Safe Breach</option>
          </select>

          <select
            value={filterSeverity}
            onChange={e => setFilterSeverity(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-2 min-h-touch text-white"
          >
            <option value="all">All Severities</option>
            <option value="minor">Minor (1-2 pts)</option>
            <option value="moderate">Moderate (3-4 pts)</option>
            <option value="major">Major (5+ pts)</option>
          </select>
        </div>

        <div className="relative w-full md:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search resident, room, incident..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-3 py-2 min-h-touch text-white focus:outline-none focus:border-rose-500"
          />
        </div>
      </div>

      {/* Violation Feed Cards */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center text-slate-400 text-xs">
            No violations found matching the current filter criteria.
          </div>
        ) : (
          filtered.map(violation => (
            <div 
              key={violation.id}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-slate-700 transition-colors shadow-sm"
            >
              <div className="flex items-start space-x-3.5">
                <div className={`mt-0.5 p-2 rounded-xl border text-xs font-bold text-center min-w-16 ${
                  violation.severity === 'major' ? 'bg-rose-950/80 border-rose-600 text-rose-300' :
                  violation.severity === 'moderate' ? 'bg-amber-950/80 border-amber-600 text-amber-300' :
                  'bg-blue-950/80 border-blue-600 text-blue-300'
                }`}>
                  <div className="text-sm font-extrabold">+{violation.demeritPoints}</div>
                  <div className="text-[9px] uppercase tracking-wider">Demerits</div>
                </div>

                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-bold text-white text-sm">{violation.studentName}</span>
                    <span className="text-xs text-amber-300 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded-md font-mono">
                      Room {violation.roomNumber}
                    </span>
                    <span className="text-[11px] text-slate-400 bg-slate-800 px-2 py-0.5 rounded capitalize">
                      {violation.category.replace(/_/g, ' ')}
                    </span>
                    <span className="text-[11px] text-slate-500 font-mono">
                      {violation.date} • {violation.createdAt}
                    </span>
                  </div>

                  <p className="text-xs text-slate-200 mt-1.5">{violation.description}</p>

                  {violation.actionRequired && (
                    <div className="text-xs text-amber-300/90 mt-1.5 flex items-center space-x-1.5 bg-amber-950/30 border border-amber-800/40 px-2.5 py-1 rounded-lg">
                      <Clock className="w-3.5 h-3.5 flex-shrink-0 text-amber-400" />
                      <span><strong>Prescribed Dean Action:</strong> {violation.actionRequired}</span>
                    </div>
                  )}

                  <div className="text-[10px] text-slate-500 mt-1">
                    Reported into system by: <span className="text-slate-400">{violation.reportedBy}</span>
                  </div>
                </div>
              </div>

              {/* Status & Actions */}
              <div className="flex items-center space-x-2 self-end sm:self-center">
                <span className={`text-xs font-bold uppercase px-2.5 py-1 rounded-full ${
                  violation.status === 'confirmed' ? 'bg-rose-900/60 text-rose-300 border border-rose-700' :
                  violation.status === 'pending_settlement' ? 'bg-amber-900/60 text-amber-300 border border-amber-700' :
                  'bg-emerald-900/60 text-emerald-300 border border-emerald-700'
                }`}>
                  {violation.status.replace('_', ' ')}
                </span>

                {canEdit && (
                  <div className="flex items-center space-x-1.5">
                    {violation.status !== 'cleared_service' && (
                      <button
                        onClick={() => updateViolationStatus(violation.id, 'cleared_service', 'Completed dorm maintenance service')}
                        className="text-xs bg-slate-800 hover:bg-slate-700 text-emerald-300 px-2.5 min-h-touch rounded-lg border border-slate-700 font-medium"
                      >
                        Clear Service
                      </button>
                    )}
                    {violation.status !== 'confirmed' && (
                      <button
                        onClick={() => updateViolationStatus(violation.id, 'confirmed')}
                        className="text-xs bg-rose-950 hover:bg-rose-900 text-rose-300 px-2.5 min-h-touch rounded-lg border border-rose-800 font-medium"
                      >
                        Confirm Demerit
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Manual Violation Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs flex items-end sm:items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-t-2xl sm:rounded-2xl max-w-lg w-full shadow-2xl max-h-[92vh] overflow-y-auto text-slate-100">
            <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white">Log Rule Violation & Demerit</h3>
                <p className="text-xs text-slate-400">Dean / Admin Disciplinary Incident Form</p>
              </div>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white min-w-touch min-h-touch flex items-center justify-center -mr-2">✕</button>
            </div>

            <form onSubmit={handleCreateViolation} className="p-4 sm:p-6 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-300 mb-1">Resident Student</label>
                  <select
                    value={selectedStudent}
                    onChange={e => setSelectedStudent(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
                  >
                    {occupants.length === 0 ? (
                      <option value="">No residents found (Enter students in Residents tab)</option>
                    ) : (
                      occupants.map(o => (
                        <option key={o.id} value={o.id}>
                          {o.name} (Room {o.roomNumber})
                        </option>
                      ))
                    )}
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-slate-300 mb-1">Violation Category</label>
                  <select
                    value={category}
                    onChange={e => setCategory(e.target.value as any)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
                  >
                    <option value="cleanliness">Room & CR Cleanliness</option>
                    <option value="worship_absence">Worship Absence</option>
                    <option value="worship_late">Worship Tardiness</option>
                    <option value="no_bible">No Bible in Worship</option>
                    <option value="curfew_breach">Curfew Breach (Past 9 PM)</option>
                    <option value="uniform_violation">School Uniform / Grooming</option>
                    <option value="irregular_school_departure">School Departure Off-Schedule</option>
                    <option value="church_absence">Church Service Absence</option>
                    <option value="study_hour_skipping">Study Hours Skipping</option>
                    <option value="chore_neglect">Chore Neglect</option>
                    <option value="lights_out_violation">Lights-Out Violation (10 PM)</option>
                    <option value="cellphone_policy_breach">Cellphone Policy Breach</option>
                    <option value="other">Other Dorm Rule</option>
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-slate-300 mb-1">Severity Level</label>
                  <select
                    value={severity}
                    onChange={e => {
                      const sev = e.target.value as any;
                      setSeverity(sev);
                      if (sev === 'minor') setDemerits(1);
                      if (sev === 'moderate') setDemerits(3);
                      if (sev === 'major') setDemerits(5);
                    }}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
                  >
                    <option value="minor">Minor Infraction</option>
                    <option value="moderate">Moderate Infraction</option>
                    <option value="major">Major Infraction</option>
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-slate-300 mb-1">Demerit Points</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={demerits}
                    onChange={e => setDemerits(Number(e.target.value))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-300 mb-1">Incident Description</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Specific details of the infraction..."
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-300 mb-1">Prescribed Action / Sanction</label>
                <input
                  type="text"
                  placeholder="e.g. 2 hours grounds cleaning, or Dean interview with parent call..."
                  value={actionRequired}
                  onChange={e => setActionRequired(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-2 min-h-touch rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 min-h-touch rounded-lg bg-rose-600 text-white font-bold hover:bg-rose-500"
                >
                  Record Violation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
