import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Download, 
  ChevronLeft, 
  ChevronRight, 
  MapPin, 
  ArrowUpDown, 
  FileSpreadsheet, 
  FileCode2,
  CheckCircle2,
  XCircle,
  Clock,
  Copy,
  Check
} from 'lucide-react';
import { Point } from '../types';

interface DataTableProps {
  points: Point[];
  selectedPointId: string | null;
  onSelectPoint: (point: Point) => void;
  activeSlsName: string | null;
}

type SortField = 'no_bangunan' | 'nama' | 'status' | 'lat' | 'long';

export const DataTable: React.FC<DataTableProps> = ({
  points,
  selectedPointId,
  onSelectPoint,
  activeSlsName,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'approved' | 'rejected' | 'pending'>('all');
  const [sortField, setSortField] = useState<SortField>('no_bangunan');
  const [sortAsc, setSortAsc] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Filter and sort points
  const filteredPoints = useMemo(() => {
    let list = [...points];

    // Status filter
    if (statusFilter === 'approved') {
      list = list.filter((p) => (p.status || '').toLowerCase().includes('approved'));
    } else if (statusFilter === 'rejected') {
      list = list.filter((p) => (p.status || '').toLowerCase().includes('rejected'));
    } else if (statusFilter === 'pending') {
      list = list.filter((p) => {
        const s = (p.status || '').toLowerCase();
        return !s.includes('approved') && !s.includes('rejected');
      });
    }

    // Search query
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      list = list.filter(
        (p) =>
          (p.nama && p.nama.toLowerCase().includes(term)) ||
          (p.no_bangunan && p.no_bangunan.toLowerCase().includes(term)) ||
          (p.kodeWilayah && p.kodeWilayah.includes(term)) ||
          (p.id && p.id.toLowerCase().includes(term)) ||
          (p.status && p.status.toLowerCase().includes(term))
      );
    }

    // Sort
    list.sort((a, b) => {
      let valA: any = a[sortField] || '';
      let valB: any = b[sortField] || '';

      if (sortField === 'no_bangunan') {
        valA = parseInt(a.no_bangunan, 10) || 0;
        valB = parseInt(b.no_bangunan, 10) || 0;
      }

      if (valA < valB) return sortAsc ? -1 : 1;
      if (valA > valB) return sortAsc ? 1 : -1;
      return 0;
    });

    return list;
  }, [points, searchTerm, statusFilter, sortField, sortAsc]);

  // Counts for tabs
  const approvedCount = useMemo(
    () => points.filter((p) => (p.status || '').toLowerCase().includes('approved')).length,
    [points]
  );
  const rejectedCount = useMemo(
    () => points.filter((p) => (p.status || '').toLowerCase().includes('rejected')).length,
    [points]
  );
  const pendingCount = points.length - approvedCount - rejectedCount;

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(filteredPoints.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paginatedPoints = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredPoints.slice(start, start + pageSize);
  }, [filteredPoints, currentPage, pageSize]);

  // Handle sort column click
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  // Export to CSV
  const exportCsv = () => {
    if (filteredPoints.length === 0) return;

    const headers = ['ID', 'Nama Bangunan / Responden', 'No Bangunan', 'Kode Wilayah', 'Latitude', 'Longitude', 'Status'];
    const rows = filteredPoints.map((p) => [
      `"${p.id}"`,
      `"${(p.nama || '').replace(/"/g, '""')}"`,
      `"${p.no_bangunan || ''}"`,
      `"${p.kodeWilayah || ''}"`,
      p.lat,
      p.long,
      `"${(p.status || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `titik_sensus_ekonomi_${activeSlsName || 'export'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export to GeoJSON
  const exportGeoJson = () => {
    if (filteredPoints.length === 0) return;

    const featureCollection = {
      type: 'FeatureCollection',
      features: filteredPoints.map((p) => ({
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [p.long, p.lat],
        },
        properties: {
          id: p.id,
          nama: p.nama,
          no_bangunan: p.no_bangunan,
          kodeWilayah: p.kodeWilayah,
          status: p.status,
        },
      })),
    };

    const blob = new Blob([JSON.stringify(featureCollection, null, 2)], {
      type: 'application/geo+json;charset=utf-8;',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `titik_sensus_${activeSlsName || 'export'}.geojson`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const copyCoords = (lat: number, long: number, id: string) => {
    navigator.clipboard.writeText(`${lat}, ${long}`);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden flex flex-col">
      {/* Table Header & Toolbar */}
      <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-base text-slate-900">Tabel Data Titik Bangunan Sensus</h3>
            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
              {filteredPoints.length} Data
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Klik baris mana saja untuk memusatkan dan menyorot titik pada peta
          </p>
        </div>

        {/* Action buttons (Export) */}
        <div className="flex items-center flex-wrap gap-2 text-xs">
          <button
            onClick={exportCsv}
            disabled={filteredPoints.length === 0}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-2xs"
            title="Ekspor data saat ini ke format CSV"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Ekspor CSV</span>
          </button>
          <button
            onClick={exportGeoJson}
            disabled={filteredPoints.length === 0}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-2xs"
            title="Ekspor titik spasial ke format GeoJSON GIS"
          >
            <FileCode2 className="w-4 h-4 text-blue-600" />
            <span>Ekspor GeoJSON</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="px-4 py-3 bg-slate-50/70 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
        {/* Status Filter Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          <button
            onClick={() => {
              setStatusFilter('all');
              setPage(1);
            }}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all shrink-0 ${
              statusFilter === 'all'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-200/70 border border-slate-200'
            }`}
          >
            Semua ({points.length})
          </button>
          <button
            onClick={() => {
              setStatusFilter('approved');
              setPage(1);
            }}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all shrink-0 flex items-center gap-1.5 ${
              statusFilter === 'approved'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-white text-emerald-700 hover:bg-emerald-50 border border-emerald-200'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            Disetujui ({approvedCount})
          </button>
          <button
            onClick={() => {
              setStatusFilter('rejected');
              setPage(1);
            }}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all shrink-0 flex items-center gap-1.5 ${
              statusFilter === 'rejected'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'bg-white text-rose-700 hover:bg-rose-50 border border-rose-200'
            }`}
          >
            <XCircle className="w-3.5 h-3.5" />
            Ditolak ({rejectedCount})
          </button>
          {pendingCount > 0 && (
            <button
              onClick={() => {
                setStatusFilter('pending');
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all shrink-0 flex items-center gap-1.5 ${
                statusFilter === 'pending'
                  ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-white text-amber-700 hover:bg-amber-50 border border-amber-200'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              Lainnya ({pendingCount})
            </button>
          )}
        </div>

        {/* Search Field */}
        <div className="relative min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari nama, no bangunan, kode..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(1);
            }}
            className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-300 bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-xs transition-all"
          />
        </div>
      </div>

      {/* Table Container */}
      <div className="overflow-x-auto max-h-[500px]">
        <table className="w-full text-left text-xs text-slate-700 border-collapse">
          <thead className="bg-slate-100/90 text-slate-600 font-semibold sticky top-0 z-10 border-b border-slate-200 select-none">
            <tr>
              <th 
                className="py-3 px-3.5 cursor-pointer hover:bg-slate-200 transition-colors w-24"
                onClick={() => handleSort('no_bangunan')}
              >
                <div className="flex items-center gap-1.5">
                  <span>No Bangunan</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th 
                className="py-3 px-3.5 cursor-pointer hover:bg-slate-200 transition-colors min-w-[180px]"
                onClick={() => handleSort('nama')}
              >
                <div className="flex items-center gap-1.5">
                  <span>Nama Bangunan / Usaha</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th 
                className="py-3 px-3.5 cursor-pointer hover:bg-slate-200 transition-colors"
                onClick={() => handleSort('status')}
              >
                <div className="flex items-center gap-1.5">
                  <span>Status Verifikasi</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th className="py-3 px-3.5">Kode SLS (Wilayah)</th>
              <th 
                className="py-3 px-3.5 cursor-pointer hover:bg-slate-200 transition-colors"
                onClick={() => handleSort('lat')}
              >
                <div className="flex items-center gap-1.5">
                  <span>Koordinat (Lat, Long)</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th className="py-3 px-3.5 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {paginatedPoints.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-slate-400 text-xs">
                  {points.length === 0
                    ? 'Belum ada titik bangunan yang dimuat. Silakan pilih wilayah SLS di filter atas.'
                    : 'Tidak ada data titik bangunan yang cocok dengan kriteria pencarian.'}
                </td>
              </tr>
            ) : (
              paginatedPoints.map((item) => {
                const isSelected = item.id === selectedPointId;
                const isApproved = (item.status || '').toLowerCase().includes('approved');
                const isRejected = (item.status || '').toLowerCase().includes('rejected');

                return (
                  <tr
                    key={item.id}
                    onClick={() => onSelectPoint(item)}
                    className={`cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-emerald-50/80 font-medium'
                        : 'hover:bg-slate-50/80'
                    }`}
                  >
                    <td className="py-2.5 px-3.5 font-bold font-mono text-slate-900">
                      #{item.no_bangunan || '-'}
                    </td>
                    <td className="py-2.5 px-3.5">
                      <div className="font-semibold text-slate-900">{item.nama || '-'}</div>
                      {item.alamat && (
                        <div className="text-[11px] text-slate-400 truncate max-w-xs">{item.alamat}</div>
                      )}
                    </td>
                    <td className="py-2.5 px-3.5">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold ${
                          isApproved
                            ? 'bg-emerald-100 text-emerald-800'
                            : isRejected
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {item.status || 'Belum Ditinjau'}
                      </span>
                    </td>
                    <td className="py-2.5 px-3.5 font-mono text-slate-500 text-[11px]">
                      {item.kodeWilayah}
                    </td>
                    <td className="py-2.5 px-3.5 font-mono text-slate-600 text-[11px]">
                      {item.lat.toFixed(6)}, {item.long.toFixed(6)}
                    </td>
                    <td className="py-2.5 px-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => copyCoords(item.lat, item.long, item.id)}
                          className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-200/70 rounded transition-colors"
                          title="Salin Koordinat"
                        >
                          {copiedId === item.id ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                        <button
                          onClick={() => onSelectPoint(item)}
                          className="p-1 text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 rounded transition-colors"
                          title="Pusatkan di Peta"
                        >
                          <MapPin className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="p-3.5 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
        <div className="flex items-center gap-2">
          <span>Baris per halaman:</span>
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setPage(1);
            }}
            className="border border-slate-300 rounded-lg px-2 py-1 bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
          <span className="text-slate-400 ml-2">
            Menampilkan {filteredPoints.length > 0 ? (currentPage - 1) * pageSize + 1 : 0} -{' '}
            {Math.min(currentPage * pageSize, filteredPoints.length)} dari {filteredPoints.length} titik
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-slate-500">
            Halaman {currentPage} dari {totalPages}
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={currentPage <= 1}
              className="p-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              title="Halaman sebelumnya"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages}
              className="p-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              title="Halaman selanjutnya"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
