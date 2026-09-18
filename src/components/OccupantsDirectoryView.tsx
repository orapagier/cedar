import React, { useState } from 'react';
import { 
  Users, 
  Search, 
  Phone, 
  Home, 
  ShieldAlert, 
  CheckCircle2, 
  FileText,
  UserCheck,
  PlusCircle,
  Upload,
  Edit2,
  Trash2,
  Lock,
  Smartphone,
  Bed,
  Layers,
  Sparkles,
  AlertCircle,
  FileSpreadsheet,
  X
} from 'lucide-react';
import { useDorm } from '../context/DormContext';
import { Modal } from './ui/Modal';
import { User, Room } from '../types/dorm';
import { demeritLabel } from '../utils/checkViolations';

export const OccupantsDirectoryView: React.FC = () => {
  const { 
    users, 
    rooms, 
    violations, 
    cellphones, 
    addOccupant, 
    updateOccupant, 
    deleteOccupant, 
    bulkImportOccupants,
    addRoom,
    updateRoom,
    deleteRoom,
    canEdit, 
    isSuperAdmin 
  } = useDorm();

  const occupants = users.filter(u => u.role === 'occupant');
  const [activeSubTab, setActiveSubTab] = useState<'students' | 'rooms'>('students');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRoomFilter, setSelectedRoomFilter] = useState<string>('all');

  // Modals state
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [showEditStudentModal, setShowEditStudentModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [showAddRoomModal, setShowAddRoomModal] = useState(false);

  // Student Form State
  const [editingStudentId, setEditingStudentId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    roomNumber: rooms[0]?.roomNumber || '101',
    phone: '',
    parentName: '',
    parentPhone: '',
    parentEmail: '',
    hasPhone: true,
    deviceModel: 'Smartphone',
  });

  // Room Form State
  const [roomFormData, setRoomFormData] = useState({
    roomNumber: '',
    wing: 'North Wing' as Room['wing'],
    floor: 1,
    capacity: 4,
    captainName: '',
  });

  // Bulk Import State
  const [bulkText, setBulkText] = useState('');
  const [bulkPreview, setBulkPreview] = useState<any[]>([]);
  const [bulkError, setBulkError] = useState('');
  const [bulkSuccess, setBulkSuccess] = useState('');

  // Filtering
  const filteredOccupants = occupants.filter(o => {
    const matchesSearch = 
      o.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (o.roomNumber && o.roomNumber.includes(searchTerm)) ||
      (o.parentName && o.parentName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (o.email && o.email.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesRoom = selectedRoomFilter === 'all' || o.roomNumber === selectedRoomFilter;
    return matchesSearch && matchesRoom;
  });

  // Open Edit Modal
  const handleOpenEdit = (occupant: User) => {
    const phoneRecord = cellphones.find(c => c.studentId === occupant.id);
    setEditingStudentId(occupant.id);
    setFormData({
      name: occupant.name,
      email: occupant.email,
      roomNumber: occupant.roomNumber || '101',
      phone: occupant.phone || '',
      parentName: occupant.parentName || '',
      parentPhone: occupant.parentPhone || '',
      parentEmail: occupant.parentEmail || '',
      hasPhone: phoneRecord ? phoneRecord.custodyStatus !== 'exempted' : true,
      deviceModel:
        phoneRecord && phoneRecord.custodyStatus !== 'exempted' ? phoneRecord.deviceModel : 'Smartphone',
    });
    setShowEditStudentModal(true);
  };

  // Save Student (Add)
  const handleSaveAddStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.roomNumber.trim()) return;

    addOccupant({
      name: formData.name.trim(),
      email: formData.email.trim(),
      roomNumber: formData.roomNumber.trim(),
      phone: formData.phone.trim(),
      parentName: formData.parentName.trim(),
      parentPhone: formData.parentPhone.trim(),
      parentEmail: formData.parentEmail.trim(),
      hasPhone: formData.hasPhone,
      deviceModel: formData.deviceModel.trim() || 'Smartphone',
    });

    setShowAddStudentModal(false);
    resetStudentForm();
  };

  // Save Student (Edit)
  const handleSaveEditStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudentId || !formData.name.trim()) return;

    updateOccupant(editingStudentId, {
      name: formData.name.trim(),
      email: formData.email.trim(),
      roomNumber: formData.roomNumber.trim(),
      phone: formData.phone.trim(),
      parentName: formData.parentName.trim(),
      parentPhone: formData.parentPhone.trim(),
      parentEmail: formData.parentEmail.trim(),
      hasPhone: formData.hasPhone,
      deviceModel: formData.deviceModel.trim() || 'Smartphone',
    });

    setShowEditStudentModal(false);
    setEditingStudentId(null);
    resetStudentForm();
  };

  const resetStudentForm = () => {
    setFormData({
      name: '',
      email: '',
      roomNumber: rooms[0]?.roomNumber || '101',
      phone: '',
      parentName: '',
      parentPhone: '',
      parentEmail: '',
      hasPhone: true,
      deviceModel: 'Smartphone',
    });
  };

  // Save New Room
  const handleSaveAddRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomFormData.roomNumber.trim()) return;

    addRoom({
      roomNumber: roomFormData.roomNumber.trim(),
      wing: roomFormData.wing,
      floor: Number(roomFormData.floor),
      capacity: Number(roomFormData.capacity),
      captainName: roomFormData.captainName.trim() || 'TBD',
    });

    setShowAddRoomModal(false);
    setRoomFormData({
      roomNumber: '',
      wing: 'North Wing',
      floor: 1,
      capacity: 4,
      captainName: '',
    });
  };

  // Parse Bulk Input
  const handleParseBulk = (text: string) => {
    setBulkText(text);
    setBulkError('');
    if (!text.trim()) {
      setBulkPreview([]);
      return;
    }

    try {
      const lines = text.trim().split('\n');
      const parsed: any[] = [];

      lines.forEach((line, index) => {
        // Skip header if contains 'name'
        if (index === 0 && line.toLowerCase().includes('name') && line.toLowerCase().includes('room')) {
          return;
        }
        // Support comma or tab separated
        const parts = line.includes('\t') ? line.split('\t') : line.split(',');
        if (parts.length >= 2) {
          const name = parts[0]?.trim();
          const roomNumber = parts[1]?.trim();
          const email = parts[2]?.trim() || '';
          const phone = parts[3]?.trim() || '';
          const parentName = parts[4]?.trim() || '';
          const parentPhone = parts[5]?.trim() || '';
          // Phone column: a model, or "none" for a resident who keeps no phone.
          const phoneCell = parts[6]?.trim() || '';
          const hasPhone = !/^(none|no|no phone|n\/a|-)$/i.test(phoneCell);
          const deviceModel = hasPhone ? phoneCell || 'Smartphone' : 'None declared';
          const parentEmail = parts[7]?.trim() || '';

          if (name && roomNumber) {
            parsed.push({
              name,
              roomNumber,
              email,
              phone,
              parentName,
              parentPhone,
              parentEmail,
              hasPhone,
              deviceModel,
            });
          }
        }
      });

      setBulkPreview(parsed);
    } catch (err) {
      setBulkError('Failed to parse text. Please ensure format: Name, Room, Email, Phone, Parent Name, Parent Phone, Phone Model, Parent Email');
    }
  };

  // Confirm Bulk Import
  const handleConfirmBulkImport = () => {
    if (bulkPreview.length === 0) return;
    const res = bulkImportOccupants(bulkPreview);
    setBulkSuccess(`Successfully imported ${res.count} residents!`);
    setTimeout(() => {
      setBulkSuccess('');
      setShowBulkModal(false);
      setBulkText('');
      setBulkPreview([]);
    }, 1500);
  };

  // Load sample bulk template
  const handleLoadSampleBulk = () => {
    const sample = `Gabriel Hernandez, 101, gabriel.h@dorm.edu, 09171112233, Antonio Hernandez, 09181112233, Smartphone\nDaniel Kim, 102, daniel.kim@dorm.edu, 09172223344, Robert Kim, 09182223344, Smartphone\nLucas Alcantara, 201, lucas.a@dorm.edu, 09173334455, Maria Alcantara, 09183334455, none`;
    handleParseBulk(sample);
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Informative Guidance Banner for Dean */}
      <div className="bg-gradient-to-r from-amber-950/40 via-slate-900 to-slate-900 border border-amber-500/40 p-4 sm:p-5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5">
            <h2 className="text-lg font-bold text-white">Actual Residents & Dormitory Quarters Management</h2>
            <span className="text-xs bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full font-medium shrink-0 whitespace-nowrap">
              Official Roster
            </span>
          </div>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl">
            This is where you register your <strong>actual dormers</strong>, assign them to rooms, record parent emergency phones, and note who keeps a phone in the vault.
          </p>
        </div>

        {canEdit && (
          <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center">
            <button
              onClick={() => {
                resetStudentForm();
                setShowAddStudentModal(true);
              }}
              className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-3.5 py-2 min-h-touch rounded-xl text-xs flex items-center space-x-1.5 transition-all shadow-md"
            >
              <PlusCircle className="w-4 h-4" />
              <span>+ Add Student</span>
            </button>

            <button
              onClick={() => {
                setBulkText('');
                setBulkPreview([]);
                setShowBulkModal(true);
              }}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold px-3 py-2 min-h-touch rounded-xl text-xs flex items-center space-x-1.5 transition-all"
              title="Bulk import roster via CSV or copy-paste"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
              <span>Bulk Import CSV</span>
            </button>

            <button
              onClick={() => setShowAddRoomModal(true)}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold px-3 py-2 min-h-touch rounded-xl text-xs flex items-center space-x-1.5 transition-all"
            >
              <Home className="w-4 h-4 text-blue-400" />
              <span>+ Add Room</span>
            </button>
          </div>
        )}
      </div>

      {/* Navigation Sub-tabs: Students vs Rooms */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center sm:gap-2">
          <button
            onClick={() => setActiveSubTab('students')}
            className={`px-3.5 py-2.5 min-h-touch rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 ${
              activeSubTab === 'students' 
                ? 'bg-amber-500 text-slate-950 shadow-sm' 
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Students Roster ({occupants.length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('rooms')}
            className={`px-3.5 py-2.5 min-h-touch rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 ${
              activeSubTab === 'rooms' 
                ? 'bg-amber-500 text-slate-950 shadow-sm' 
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Bed className="w-4 h-4" />
            <span>Rooms & Quarters ({rooms.length})</span>
          </button>
        </div>

        {/* Filter bar */}
        {activeSubTab === 'students' && (
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full sm:w-auto">
            <select
              value={selectedRoomFilter}
              onChange={e => setSelectedRoomFilter(e.target.value)}
              className="bg-slate-800 border border-slate-700 text-slate-200 rounded-xl px-2.5 py-2 min-h-touch text-xs focus:outline-none"
            >
              <option value="all">All Rooms</option>
              {rooms.map(r => (
                <option key={r.id} value={r.roomNumber}>Room {r.roomNumber}</option>
              ))}
            </select>

            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search name, phone, parent..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-8 pr-3 py-2 min-h-touch text-xs text-white focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>
        )}
      </div>

      {/* VIEW 1: STUDENTS DIRECTORY */}
      {activeSubTab === 'students' && (
        <div className="space-y-4">
          {occupants.length === 0 ? (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mx-auto">
                <Users className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">No Students in Roster</h3>
                <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                  You have cleared the test records or have not added students yet. Enter your actual students now!
                </p>
              </div>
              {canEdit && (
                <div className="flex items-center justify-center gap-3 pt-2">
                  <button
                    onClick={() => {
                      resetStudentForm();
                      setShowAddStudentModal(true);
                    }}
                    className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 py-2 min-h-touch rounded-xl text-xs flex items-center space-x-1.5"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>+ Add First Student</span>
                  </button>
                  <button
                    onClick={() => setShowBulkModal(true)}
                    className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-4 py-2 min-h-touch rounded-xl text-xs font-semibold"
                  >
                    Bulk Import Roster
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredOccupants.map(occupant => {
                const room = rooms.find(r => r.roomNumber === occupant.roomNumber);
                const studentViolations = violations.filter(v => v.studentId === occupant.id);
                const phoneRecord = cellphones.find(c => c.studentId === occupant.id);
                const isProbation = (occupant.demerits || 0) >= 8;

                return (
                  <div 
                    key={occupant.id}
                    className={`p-4 sm:p-5 rounded-2xl border transition-all flex flex-col justify-between ${
                      isProbation ? 'bg-slate-900 border-rose-600/60 shadow-rose-950/20 shadow-lg' : 'bg-slate-900 border-slate-800'
                    }`}
                  >
                    <div>
                      {/* Top Header */}
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <div className="min-w-0">
                          <h3 className="font-bold text-white text-base leading-snug">{occupant.name}</h3>
                          <div className="text-xs text-slate-400 font-mono truncate">{occupant.email}</div>
                        </div>
                        <span className={`shrink-0 whitespace-nowrap text-xs font-bold px-2.5 py-1 rounded-full ${
                          isProbation ? 'bg-rose-950 text-rose-300 border border-rose-700' :
                          occupant.demerits > 0 ? 'bg-amber-950 text-amber-300 border border-amber-700' :
                          'bg-emerald-950 text-emerald-300 border border-emerald-700'
                        }`}>
                          {demeritLabel(occupant.demerits)}
                        </span>
                      </div>

                      {/* Details Box */}
                      <div className="space-y-2 text-xs text-slate-300 bg-slate-950/50 p-3 rounded-xl border border-slate-800/80">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">Assigned Room:</span>
                          <span className="font-semibold text-white">
                            Room {occupant.roomNumber} {room ? `(${room.wing})` : ''}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">Student Phone:</span>
                          <span className="font-mono text-slate-200">{occupant.phone || 'Not provided'}</span>
                        </div>
                        <div className="flex items-center justify-between border-t border-slate-800/80 pt-1.5">
                          <span className="text-slate-400">Parent / Guardian:</span>
                          <span className="font-medium text-slate-200">{occupant.parentName || 'Not provided'}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">Emergency Contact:</span>
                          <span className="font-mono text-amber-400 font-medium">{occupant.parentPhone || 'Not provided'}</span>
                        </div>
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-slate-400 shrink-0">Parent Login:</span>
                          <span className="font-mono text-[11px] text-emerald-300/90 text-right break-all">
                            {occupant.parentEmail || 'No parent email'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between border-t border-slate-800/80 pt-1.5">
                          <span className="text-slate-400">Phone Vault:</span>
                          <span className="text-xs text-purple-300">
                            {phoneRecord?.custodyStatus === 'exempted'
                              ? 'No phone — exempt'
                              : phoneRecord?.deviceModel || 'Smartphone'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                      <span className="text-[11px] text-slate-400">
                        {studentViolations.length} violations
                      </span>

                      {canEdit && (
                        <div className="flex items-center space-x-1.5">
                          <button
                            onClick={() => handleOpenEdit(occupant)}
                            className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-2.5 min-h-touch rounded-lg text-xs font-medium flex items-center space-x-1 border border-slate-700"
                          >
                            <Edit2 className="w-3 h-3 text-amber-400" />
                            <span>Edit</span>
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`Remove resident "${occupant.name}" from the dormitory roster?`)) {
                                deleteOccupant(occupant.id);
                              }
                            }}
                            className="bg-slate-800 hover:bg-rose-950 text-slate-400 hover:text-rose-300 min-w-touch min-h-touch flex items-center justify-center rounded-lg text-xs transition-colors"
                            title="Delete Student"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* VIEW 2: ROOMS & QUARTERS MANAGEMENT */}
      {activeSubTab === 'rooms' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {rooms.map(room => {
              const roomOccupants = users.filter(u => u.role === 'occupant' && u.roomNumber === room.roomNumber);
              const isFull = roomOccupants.length >= room.capacity;

              return (
                <div key={room.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center space-x-2">
                        <h3 className="font-bold text-white text-lg">Room {room.roomNumber}</h3>
                        <span className="text-xs bg-slate-800 text-slate-300 px-2 py-0.5 rounded font-mono">
                          Floor {room.floor}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400">{room.wing}</p>
                    </div>

                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                      isFull ? 'bg-amber-950 text-amber-300 border border-amber-700' : 'bg-emerald-950 text-emerald-300 border border-emerald-700'
                    }`}>
                      {roomOccupants.length} / {room.capacity} Beds
                    </span>
                  </div>

                  <div className="text-xs text-slate-300 space-y-1.5 bg-slate-950/50 p-3 rounded-xl border border-slate-800/80">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Assigned Room Captain:</span>
                      <span className="font-semibold text-amber-400">{room.captainName || 'Not designated'}</span>
                    </div>
                    <div className="border-t border-slate-800 pt-1.5">
                      <span className="text-slate-400 block mb-1">Current Residents:</span>
                      {roomOccupants.length === 0 ? (
                        <span className="text-slate-500 italic">No students assigned to this room yet</span>
                      ) : (
                        <div className="space-y-1">
                          {roomOccupants.map(occ => (
                            <div key={occ.id} className="flex justify-between items-center text-[11px]">
                              <span className="text-slate-200 font-medium">• {occ.name}</span>
                              <span className="text-slate-500 font-mono">{occ.phone || 'No phone'}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {canEdit && (
                    <div className="flex items-center justify-end space-x-2 pt-1">
                      <button
                        onClick={() => {
                          const newCap = prompt(`Update capacity for Room ${room.roomNumber}:`, room.capacity.toString());
                          if (newCap && !isNaN(Number(newCap))) {
                            updateRoom(room.id, { capacity: Number(newCap) });
                          }
                        }}
                        className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-2.5 min-h-touch rounded-lg border border-slate-700"
                      >
                        Edit Capacity
                      </button>
                      <button
                        onClick={() => {
                          const newCapt = prompt(`Assign new Room Captain for Room ${room.roomNumber}:`, room.captainName);
                          if (newCapt !== null) {
                            updateRoom(room.id, { captainName: newCapt.trim() || 'TBD' });
                          }
                        }}
                        className="text-xs bg-slate-800 hover:bg-slate-700 text-amber-300 px-2.5 min-h-touch rounded-lg border border-slate-700"
                      >
                        Set Captain
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Delete Room ${room.roomNumber}?`)) {
                            deleteRoom(room.id);
                          }
                        }}
                        className="text-xs bg-slate-800 hover:bg-rose-950 text-rose-300 min-w-touch min-h-touch flex items-center justify-center rounded-lg transition-colors"
                        title="Delete Room"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* MODAL 1: ADD NEW STUDENT */}
      {showAddStudentModal && (
        <Modal onClose={() => setShowAddStudentModal(false)}>
          <div className="bg-slate-900 border border-slate-700 rounded-t-2xl sm:rounded-2xl max-w-lg w-full shadow-2xl max-h-[92vh] overflow-y-auto text-slate-100">
            <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white">Add Actual Resident Student</h3>
                <p className="text-xs text-slate-400">Register new occupant into dormitory roster</p>
              </div>
              <button onClick={() => setShowAddStudentModal(false)} className="text-slate-400 hover:text-white min-w-touch min-h-touch flex items-center justify-center -mr-2">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAddStudent} className="p-4 sm:p-6 space-y-3.5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="block font-semibold text-slate-300 mb-1">Student Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Gabriel Santos"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Room Number *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 101, 102, 201..."
                    value={formData.roomNumber}
                    onChange={e => setFormData({ ...formData, roomNumber: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Student Email (optional)</label>
                  <input
                    type="email"
                    placeholder="e.g. student@school.edu"
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Student Phone</label>
                  <input
                    type="text"
                    placeholder="e.g. 0917-123-4567"
                    value={formData.phone}
                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Parent / Guardian Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Maria Santos"
                    value={formData.parentName}
                    onChange={e => setFormData({ ...formData, parentName: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Emergency Parent Contact *</label>
                  <input
                    type="text"
                    placeholder="e.g. 0918-987-6543"
                    value={formData.parentPhone}
                    onChange={e => setFormData({ ...formData, parentPhone: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Parent Google Email</label>
                  <input
                    type="email"
                    placeholder="e.g. maria.santos@gmail.com"
                    value={formData.parentEmail}
                    onChange={e => setFormData({ ...formData, parentEmail: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Has a phone in the dorm?</label>
                  <select
                    value={formData.hasPhone ? 'yes' : 'no'}
                    onChange={e => setFormData({ ...formData, hasPhone: e.target.value === 'yes' })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
                  >
                    <option value="yes">Yes — deposits a phone each cycle</option>
                    <option value="no">No phone — exempt from the vault run</option>
                  </select>
                </div>

                {formData.hasPhone && (
                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">Phone Model</label>
                    <input
                      type="text"
                      placeholder="Smartphone"
                      value={formData.deviceModel}
                      onChange={e => setFormData({ ...formData, deviceModel: e.target.value })}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
                    />
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddStudentModal(false)}
                  className="px-3 py-2 min-h-touch rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 min-h-touch rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold"
                >
                  Save Resident
                </button>
              </div>
            </form>
          </div>
        </Modal>
      )}

      {/* MODAL 2: EDIT STUDENT */}
      {showEditStudentModal && (
        <Modal onClose={() => setShowEditStudentModal(false)}>
          <div className="bg-slate-900 border border-slate-700 rounded-t-2xl sm:rounded-2xl max-w-lg w-full shadow-2xl max-h-[92vh] overflow-y-auto text-slate-100">
            <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white">Edit Resident Information</h3>
                <p className="text-xs text-slate-400">Update contact, room, or phone details</p>
              </div>
              <button onClick={() => setShowEditStudentModal(false)} className="text-slate-400 hover:text-white min-w-touch min-h-touch flex items-center justify-center -mr-2">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditStudent} className="p-4 sm:p-6 space-y-3.5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="block font-semibold text-slate-300 mb-1">Student Full Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Room Number *</label>
                  <input
                    type="text"
                    required
                    value={formData.roomNumber}
                    onChange={e => setFormData({ ...formData, roomNumber: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Student Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Student Phone</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Parent / Guardian Name</label>
                  <input
                    type="text"
                    value={formData.parentName}
                    onChange={e => setFormData({ ...formData, parentName: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Emergency Parent Contact</label>
                  <input
                    type="text"
                    value={formData.parentPhone}
                    onChange={e => setFormData({ ...formData, parentPhone: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Parent Google Email</label>
                  <input
                    type="email"
                    value={formData.parentEmail}
                    onChange={e => setFormData({ ...formData, parentEmail: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Has a phone in the dorm?</label>
                  <select
                    value={formData.hasPhone ? 'yes' : 'no'}
                    onChange={e => setFormData({ ...formData, hasPhone: e.target.value === 'yes' })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
                  >
                    <option value="yes">Yes — deposits a phone each cycle</option>
                    <option value="no">No phone — exempt from the vault run</option>
                  </select>
                </div>

                {formData.hasPhone && (
                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">Phone Model</label>
                    <input
                      type="text"
                      placeholder="Smartphone"
                      value={formData.deviceModel}
                      onChange={e => setFormData({ ...formData, deviceModel: e.target.value })}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
                    />
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowEditStudentModal(false)}
                  className="px-3 py-2 min-h-touch rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 min-h-touch rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold"
                >
                  Update Information
                </button>
              </div>
            </form>
          </div>
        </Modal>
      )}

      {/* MODAL 3: BULK IMPORT CSV / TEXT */}
      {showBulkModal && (
        <Modal onClose={() => setShowBulkModal(false)}>
          <div className="bg-slate-900 border border-slate-700 rounded-t-2xl sm:rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden text-slate-100 flex flex-col max-h-[92vh]">
            <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white">Bulk Import Students Roster</h3>
                <p className="text-xs text-slate-400">Paste comma-separated rows or CSV text</p>
              </div>
              <button onClick={() => setShowBulkModal(false)} className="text-slate-400 hover:text-white min-w-touch min-h-touch flex items-center justify-center -mr-2">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 sm:p-6 overflow-y-auto space-y-4 text-xs">
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-slate-300">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-bold text-amber-400">Required Format (Columns in order):</span>
                  <button
                    onClick={handleLoadSampleBulk}
                    className="text-[11px] text-amber-300 hover:underline bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30"
                  >
                    Load Sample Roster
                  </button>
                </div>
                <code className="text-[11px] text-slate-400 font-mono block">
                  Name, Room, Email, Phone, Parent Name, Parent Phone, Phone Model (or "none"), Parent Email
                </code>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Paste Roster Lines Here:</label>
                <textarea
                  rows={5}
                  value={bulkText}
                  onChange={e => handleParseBulk(e.target.value)}
                  placeholder="Juan Dela Cruz, 101, juan@school.edu, 09171112222, Pedro Dela Cruz, 09183334444, Smartphone, parent@gmail.com..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white font-mono text-xs focus:outline-none focus:border-amber-500"
                />
              </div>

              {bulkError && (
                <div className="p-3 bg-rose-950/60 border border-rose-600 text-rose-300 rounded-xl text-xs flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{bulkError}</span>
                </div>
              )}

              {bulkSuccess && (
                <div className="p-3 bg-emerald-950/60 border border-emerald-600 text-emerald-300 rounded-xl text-xs flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                  <span>{bulkSuccess}</span>
                </div>
              )}

              {bulkPreview.length > 0 && (
                <div>
                  <div className="font-bold text-white mb-2 flex items-center justify-between">
                    <span>Parsed Residents Preview ({bulkPreview.length} found):</span>
                  </div>
                  <div className="max-h-48 overflow-y-auto overflow-x-auto border border-slate-800 rounded-xl">
                    <table className="w-full text-left text-[11px]">
                      <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                        <tr>
                          <th className="p-2">Name</th>
                          <th className="p-2">Room</th>
                          <th className="p-2">Email</th>
                          <th className="p-2">Emergency Parent</th>
                          <th className="p-2">Phone</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800">
                        {bulkPreview.map((item, idx) => (
                          <tr key={idx} className="hover:bg-slate-800/40">
                            <td className="p-2 font-semibold text-white">{item.name}</td>
                            <td className="p-2 text-amber-300 font-mono">Room {item.roomNumber}</td>
                            <td className="p-2 text-slate-400 font-mono">{item.email}</td>
                            <td className="p-2 text-slate-300">{item.parentPhone || item.parentName || '-'}</td>
                            <td className="p-2 text-purple-300">{item.hasPhone ? item.deviceModel : 'No phone'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 sm:p-5 border-t border-slate-800 flex items-center justify-end space-x-2">
              <button
                type="button"
                onClick={() => setShowBulkModal(false)}
                className="px-3 py-2 min-h-touch rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={bulkPreview.length === 0}
                onClick={handleConfirmBulkImport}
                className="px-4 py-2 min-h-touch rounded-lg bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-slate-950 font-bold text-xs flex items-center space-x-1.5"
              >
                <Upload className="w-4 h-4" />
                <span>Import {bulkPreview.length} Residents</span>
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* MODAL 4: ADD ROOM */}
      {showAddRoomModal && (
        <Modal onClose={() => setShowAddRoomModal(false)}>
          <div className="bg-slate-900 border border-slate-700 rounded-t-2xl sm:rounded-2xl max-w-md w-full shadow-2xl max-h-[92vh] overflow-y-auto text-slate-100">
            <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white">Create New Dormitory Room</h3>
                <p className="text-xs text-slate-400">Add physical quarters for student occupancy</p>
              </div>
              <button onClick={() => setShowAddRoomModal(false)} className="text-slate-400 hover:text-white min-w-touch min-h-touch flex items-center justify-center -mr-2">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAddRoom} className="p-4 sm:p-6 space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Room Number *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 105, 203, 301"
                  value={roomFormData.roomNumber}
                  onChange={e => setRoomFormData({ ...roomFormData, roomNumber: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Wing Location</label>
                <select
                  value={roomFormData.wing}
                  onChange={e => setRoomFormData({ ...roomFormData, wing: e.target.value as any })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
                >
                  <option value="North Wing">North Wing</option>
                  <option value="South Wing">South Wing</option>
                  <option value="East Wing">East Wing</option>
                  <option value="West Wing">West Wing</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Floor Level</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={roomFormData.floor}
                    onChange={e => setRoomFormData({ ...roomFormData, floor: Number(e.target.value) })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Bed Capacity</label>
                  <input
                    type="number"
                    min="1"
                    max="12"
                    value={roomFormData.capacity}
                    onChange={e => setRoomFormData({ ...roomFormData, capacity: Number(e.target.value) })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Designated Room Captain</label>
                <input
                  type="text"
                  placeholder="e.g. Senior Student / Monitor"
                  value={roomFormData.captainName}
                  onChange={e => setRoomFormData({ ...roomFormData, captainName: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddRoomModal(false)}
                  className="px-3 py-2 min-h-touch rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 min-h-touch rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold"
                >
                  Save Room
                </button>
              </div>
            </form>
          </div>
        </Modal>
      )}
    </div>
  );
};
