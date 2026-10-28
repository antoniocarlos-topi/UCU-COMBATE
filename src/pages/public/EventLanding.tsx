import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CinematicEnvelope } from '../../components/invitation/CinematicEnvelope';
import { RefusalModal } from '../../components/invitation/RefusalModal';
import { Loader } from '../../components/common/Loader';
import {
  getEventInvitationBySlug,
  recordInvitationRefusal,
  EventInvitationData,
  DEFAULT_INAUGURAL_EVENT,
} from '../../services/eventService';

export const EventLanding: React.FC = () => {
  const { slug, eventSlug } = useParams<{ slug?: string; eventSlug?: string }>();
  const navigate = useNavigate();

  const currentSlug = eventSlug || slug || 'arena-inaugural';

  const [eventData, setEventData] = useState<EventInvitationData>(DEFAULT_INAUGURAL_EVENT);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefusalModalOpen, setIsRefusalModalOpen] = useState(false);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    getEventInvitationBySlug(currentSlug)
      .then((data) => {
        if (isMounted) {
          setEventData(data);
          setIsLoading(false);
        }
      })
      .catch(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [currentSlug]);

  const handleAccept = () => {
    navigate(`/convite/${eventData.slug}/inscrever`);
  };

  const handleDecline = async () => {
    await recordInvitationRefusal(eventData.slug);
    setIsRefusalModalOpen(true);
  };

  if (isLoading) {
    return <Loader fullPage text="Preparando seu convite..." />;
  }

  return (
    <div className="animate-fade-in" style={{ width: '100%' }}>
      {/* Experiência da Carta / Envelope Cinematográfico */}
      <CinematicEnvelope
        event={eventData}
        onAccept={handleAccept}
        onDecline={handleDecline}
      />

      {/* Modal de Tratamento de Recusa Amigável */}
      <RefusalModal
        isOpen={isRefusalModalOpen}
        onClose={() => setIsRefusalModalOpen(false)}
        whatsappUrl={eventData.whatsapp_group_url}
      />
    </div>
  );
};
