import { useState, useEffect } from 'react';
import ComplaintViewModal from './ComplaintViewModal';
import { API_BASE_URL } from '../config';

export default function ComplaintsList({ companySlug }) {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);

  useEffect(() => {
    const fetchComplaints = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/companies/${companySlug}/complaints`);
        if (!response.ok) {
          throw new Error('Falha ao carregar denúncias');
        }
        const data = await response.json();
        setComplaints(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchComplaints();
  }, [companySlug]);

  const handleViewComplaint = (complaint) => {
    setSelectedComplaint(complaint);
    setIsViewModalOpen(true);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-secondary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  if (complaints.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Nenhuma denúncia encontrada.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-gray-900">Denúncias Recebidas</h2>
      
      <div className="grid gap-4">
        {complaints.map((complaint) => (
          <div
            key={complaint.id}
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-4"
          >
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-medium text-gray-900">{complaint.subject}</h3>
                <p className="text-sm text-gray-500 mt-1">
                  {new Date(complaint.created_at).toLocaleString('pt-BR')}
                </p>
              </div>
              <button
                onClick={() => handleViewComplaint(complaint)}
                className="text-secondary hover:text-orange-600 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </button>
            </div>
            
            <p className="text-gray-600 mt-2 line-clamp-2">{complaint.description}</p>
            
            {complaint.attachments && (
              <div className="mt-3 flex items-center text-sm text-gray-500">
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                </svg>
                {complaint.attachments.split(',').length} anexo(s)
              </div>
            )}
          </div>
        ))}
      </div>

      <ComplaintViewModal
        isOpen={isViewModalOpen}
        onClose={() => {
          setIsViewModalOpen(false);
          setSelectedComplaint(null);
        }}
        complaint={selectedComplaint}
      />
    </div>
  );
} 