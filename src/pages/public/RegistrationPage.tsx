import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card } from '../../components/common/Card';
import { InputField } from '../../components/common/InputField';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Loader } from '../../components/common/Loader';
import { useToast } from '../../contexts/ToastContext';
import {
  getEventInvitationBySlug,
  EventInvitationData,
  DEFAULT_INAUGURAL_EVENT,
} from '../../services/eventService';
import {
  checkNicknameAvailability,
  submitAthleteRegistration,
} from '../../services/registrationService';
import {
  processAndCompressAthleteAvatar,
  ImageProcessingResult,
} from '../../utils/imageCompressor';
import {
  validateAthleteWeight,
  findWeightCategoryForWeight,
  calculateAgeAtEvent,
} from '../../utils/validationRules';
import {
  Scale,
  ShieldAlert,
  CheckCircle,
  Upload,
  MessageCircle,
  KeyRound,
  FileCheck,
  Info,
} from 'lucide-react';

export const RegistrationPage: React.FC = () => {
  const { slug, eventSlug } = useParams<{ slug?: string; eventSlug?: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const currentSlug = eventSlug || slug || 'arena-inaugural';

  // Dados do evento
  const [eventData, setEventData] = useState<EventInvitationData>(DEFAULT_INAUGURAL_EVENT);
  const [isEventLoading, setIsEventLoading] = useState(true);

  // Campos do formulário
  const [fullName, setFullName] = useState('');
  const [nickname, setNickname] = useState('');
  const [nicknameChecking, setNicknameChecking] = useState(false);
  const [nicknameError, setNicknameError] = useState<string | undefined>(undefined);
  const [password, setPassword] = useState('');
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [declaredWeight, setDeclaredWeight] = useState('');
  const [inviteCode, setInviteCode] = useState('');

  // Menor de idade
  const [isMinor, setIsMinor] = useState(false);
  const [guardianName, setGuardianName] = useState('');
  const [guardianRelationship, setGuardianRelationship] = useState('');
  const [guardianPhone, setGuardianPhone] = useState('');
  const [guardianDoc, setGuardianDoc] = useState('');

  // Consentimentos
  const [imageConsent, setImageConsent] = useState(false);
  const [termsConsent, setTermsConsent] = useState(false);

  // Upload de Foto
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [avatarResult, setAvatarResult] = useState<ImageProcessingResult | null>(null);
  const [isCompressingPhoto, setIsCompressingPhoto] = useState(false);

  // Estados de submissão
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionSuccess, setSubmissionSuccess] = useState<boolean>(false);
  const [registeredData, setRegisteredData] = useState<{
    nickname: string;
    categoryName: string;
    whatsappUrl?: string | null;
  } | null>(null);

  // Carregar dados do evento ao montar
  useEffect(() => {
    let isMounted = true;
    setIsEventLoading(true);

    getEventInvitationBySlug(currentSlug)
      .then((data) => {
        if (isMounted) {
          setEventData(data);
          setIsEventLoading(false);
        }
      })
      .catch(() => {
        if (isMounted) setIsEventLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [currentSlug]);

  // Validação dinâmica do apelido (com debounce)
  useEffect(() => {
    if (!nickname.trim() || nickname.trim().length < 3) {
      setNicknameError(undefined);
      return;
    }

    const timer = setTimeout(async () => {
      setNicknameChecking(true);
      const res = await checkNicknameAvailability(nickname);
      setNicknameChecking(false);
      if (!res.available) {
        setNicknameError(res.error);
      } else {
        setNicknameError(undefined);
      }
    }, 450);

    return () => clearTimeout(timer);
  }, [nickname]);

  // Atualização de idade ao mudar data de nascimento
  const handleBirthDateChange = (val: string) => {
    setBirthDate(val);
    if (!val) {
      setIsMinor(false);
      return;
    }
    const age = calculateAgeAtEvent(val);
    setIsMinor(age < 18);
  };

  // Upload e compressão de foto
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsCompressingPhoto(true);
      const result = await processAndCompressAthleteAvatar(file);
      setAvatarResult(result);
      showToast(
        `Foto otimizada com sucesso em WebP (${result.compressedSizeKb} KB).`,
        'success'
      );
    } catch (err: any) {
      showToast(err.message || 'Erro ao processar imagem.', 'error');
    } finally {
      setIsCompressingPhoto(false);
    }
  };

  // Categoria identificada dinamicamente
  const detectedCategory = (() => {
    const weightVal = validateAthleteWeight(declaredWeight);
    if (weightVal.valid && weightVal.parsedWeight !== undefined) {
      return findWeightCategoryForWeight(weightVal.parsedWeight, eventData.categories);
    }
    return null;
  })();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (nicknameError) {
      showToast('Por favor, escolha um apelido válido e disponível.', 'warning');
      return;
    }

    if (!avatarResult?.file) {
      showToast('A foto de rosto do atleta é obrigatória para o card oficial.', 'warning');
      return;
    }

    if (password.length < 6) {
      showToast('A senha deve ter no mínimo 6 caracteres.', 'warning');
      return;
    }

    setIsSubmitting(true);

    const result = await submitAthleteRegistration({
      event: eventData,
      fullName,
      nickname,
      password,
      recoveryEmail,
      phone,
      birthDate,
      declaredWeight,
      avatarFile: avatarResult.file,
      inviteCode: eventData.requires_invite ? inviteCode : undefined,
      guardianName: isMinor ? guardianName : undefined,
      guardianRelationship: isMinor ? guardianRelationship : undefined,
      guardianPhone: isMinor ? guardianPhone : undefined,
      guardianDoc: isMinor ? guardianDoc : undefined,
      imageConsent,
      termsConsent,
    });

    setIsSubmitting(false);

    if (!result.success) {
      showToast(result.error || 'Erro ao processar inscrição.', 'error');
    } else {
      setRegisteredData({
        nickname,
        categoryName: detectedCategory?.name || 'Aguardando pesagem',
        whatsappUrl: result.whatsappUrl,
      });
      setSubmissionSuccess(true);
      showToast('Inscrição enviada com sucesso! Aguardando moderação.', 'success');
    }
  };

  if (isEventLoading) {
    return <Loader fullPage text="Carregando formulário oficial..." />;
  }

  // TELA DE SUCESSO E ORIENTAÇÕES PÓS-CADASTRO
  if (submissionSuccess && registeredData) {
    const hasValidWhatsApp = !!registeredData.whatsappUrl && registeredData.whatsappUrl.startsWith('https://');

    return (
      <div className="animate-scale-in" style={{ padding: 'var(--space-4) 0 var(--space-8)' }}>
        <Card headerAccent="gold">
          <div style={{ textAlign: 'center', padding: 'var(--space-4) 0' }}>
            <div
              style={{
                width: '68px',
                height: '68px',
                borderRadius: '50%',
                backgroundColor: 'var(--color-status-approved-bg)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--color-status-approved)',
                marginBottom: 'var(--space-4)',
              }}
            >
              <CheckCircle size={38} />
            </div>

            <h2 style={{ fontSize: 'var(--font-size-2xl)', textTransform: 'uppercase', marginBottom: 'var(--space-2)' }}>
              Inscrição Recebida!
            </h2>

            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 'var(--space-4)' }}>
              <Badge variant="pending">Status: Aguardando Moderação</Badge>
            </div>

            <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)', maxWidth: '440px', margin: '0 auto var(--space-6)', lineHeight: 1.6 }}>
              Parabéns, <strong style={{ color: '#fff' }}>{registeredData.nickname}</strong>! Sua inscrição foi vinculada ao evento oficial. Os organizadores irão avaliar sua foto e seus dados antes de confirmar sua participação no card de lutas.
            </p>

            {/* Resumo da Inscrição */}
            <div
              style={{
                backgroundColor: 'rgba(212, 175, 55, 0.08)',
                border: '1px solid var(--color-border-gold)',
                borderRadius: 'var(--radius-md)',
                padding: 'var(--space-4)',
                textAlign: 'left',
                marginBottom: 'var(--space-6)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                <FileCheck size={18} color="var(--color-gold-primary)" />
                <span style={{ fontSize: 'var(--font-size-xs)', fontWeight: 700, color: 'var(--color-gold-light)', textTransform: 'uppercase' }}>
                  Resumo do Registro
                </span>
              </div>
              <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
                Apelido de Login: <strong style={{ color: '#fff' }}>{registeredData.nickname}</strong>
              </p>
              <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                Categoria Alocada: <strong style={{ color: '#fff' }}>{registeredData.categoryName}</strong>
              </p>
            </div>

            {/* Ações: Grupo de WhatsApp e Login */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              {hasValidWhatsApp ? (
                <Button
                  variant="gold"
                  size="lg"
                  fullWidth
                  leftIcon={<MessageCircle size={22} />}
                  onClick={() => window.open(registeredData.whatsappUrl!, '_blank')}
                >
                  Entrar no Grupo Oficial do WhatsApp
                </Button>
              ) : (
                <div
                  style={{
                    padding: 'var(--space-3)',
                    backgroundColor: 'rgba(255, 255, 255, 0.04)',
                    borderRadius: 'var(--radius-md)',
                    fontSize: 'var(--font-size-xs)',
                    color: 'var(--color-text-muted)',
                  }}
                >
                  Fique atento ao seu telefone para contato oficial da organização.
                </div>
              )}

              <Button
                variant="secondary"
                size="md"
                fullWidth
                leftIcon={<KeyRound size={18} />}
                onClick={() => navigate('/login')}
              >
                Ir para o Portal de Acesso (Login)
              </Button>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)', paddingBottom: 'var(--space-8)' }}>
      <div>
        <h2 style={{ fontSize: 'var(--font-size-2xl)', textTransform: 'uppercase' }}>
          Inscrição de Combate
        </h2>
        <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)', marginTop: '2px' }}>
          {eventData.title}
        </p>
      </div>

      {/* Alerta de Credenciais */}
      <div
        style={{
          backgroundColor: 'rgba(212, 175, 55, 0.08)',
          border: '1px solid var(--color-border-gold)',
          borderRadius: 'var(--radius-md)',
          padding: 'var(--space-3) var(--space-4)',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
        }}
      >
        <Info size={20} color="var(--color-gold-primary)" style={{ flexShrink: 0 }} />
        <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)', lineHeight: 1.4 }}>
          O <strong>Apelido</strong> e a <strong>Senha</strong> cadastrados aqui serão suas únicas chaves de acesso ao portal do atleta.
        </span>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        {/* Seção 1: Identificação e Acesso */}
        <Card title="1. Identificação e Acesso" headerAccent="gold">
          <InputField
            label="Nome Completo"
            placeholder="Ex: Carlos Eduardo Silva"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
          />

          <InputField
            label="Apelido de Combate Único"
            placeholder="Ex: Demolidor"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            error={nicknameError}
            helperText={
              nicknameChecking
                ? 'Verificando disponibilidade do apelido...'
                : 'Nome exibido no card oficial e utilizado para login.'
            }
            required
          />

          <InputField
            label="Senha de Acesso"
            placeholder="Mínimo 6 caracteres"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            isPassword
            helperText="Guarde esta senha para consultar seus confrontos."
            required
          />

          <InputField
            label="E-mail de Recuperação (Privado)"
            type="email"
            placeholder="atleta@email.com"
            value={recoveryEmail}
            onChange={(e) => setRecoveryEmail(e.target.value)}
            helperText="Nunca será exibido publicamente. Usado estritamente para recuperação de senha."
            required
          />

          <InputField
            label="WhatsApp / Telefone com DDD"
            placeholder="(11) 99999-9999"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
          />
        </Card>

        {/* Seção 2: Peso, Categoria e Foto de Rosto */}
        <Card title="2. Pesagem e Foto Oficial">
          <InputField
            label="Data de Nascimento"
            type="date"
            value={birthDate}
            onChange={(e) => handleBirthDateChange(e.target.value)}
            required
          />

          <InputField
            label="Peso Declarado (kg)"
            placeholder="Ex: 68.50"
            value={declaredWeight}
            onChange={(e) => setDeclaredWeight(e.target.value)}
            leftIcon={<Scale size={18} />}
            helperText="Permitido estritamente de 50,00 kg a 90,00 kg (duas casas decimais)."
            required
          />

          {/* Feedback da Categoria Identificada */}
          {detectedCategory && (
            <div
              style={{
                marginTop: 'var(--space-1)',
                marginBottom: 'var(--space-4)',
                padding: 'var(--space-3)',
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                borderRadius: 'var(--radius-sm)',
                fontSize: 'var(--font-size-xs)',
                color: 'var(--color-status-approved)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <CheckCircle size={16} />
              <span>
                Categoria detectada: <strong>{detectedCategory.name}</strong>
              </span>
            </div>
          )}

          {/* Componente de Upload e Pré-Visualização com WebP */}
          <div>
            <label
              style={{
                display: 'block',
                fontSize: 'var(--font-size-sm)',
                fontWeight: 600,
                color: 'var(--color-text-secondary)',
                marginBottom: 'var(--space-2)',
              }}
            >
              Foto de Rosto do Lutador (Obrigatória) *
            </label>

            <input
              type="file"
              ref={fileInputRef}
              accept="image/jpeg,image/png,image/webp"
              onChange={handleFileSelect}
              style={{ display: 'none' }}
            />

            <div
              onClick={() => fileInputRef.current?.click()}
              className="interactive-tap"
              style={{
                border: '2px dashed var(--color-border-gold)',
                borderRadius: 'var(--radius-md)',
                padding: 'var(--space-4)',
                textAlign: 'center',
                backgroundColor: 'var(--color-bg-surface)',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              {isCompressingPhoto ? (
                <Loader size="sm" text="Otimizando imagem para WebP..." />
              ) : avatarResult ? (
                <div
                  style={{
                    width: '100%',
                    padding: 'var(--space-4)',
                    backgroundColor: '#121218',
                    border: '2px solid var(--color-border-gold)',
                    borderRadius: 'var(--radius-lg)',
                    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.6), 0 0 20px rgba(212, 175, 55, 0.15)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '12px',
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      height: '3px',
                      background: 'var(--gradient-gold)',
                    }}
                  />
                  <span
                    style={{
                      fontSize: '0.68rem',
                      fontFamily: 'var(--font-family-heading)',
                      fontWeight: 800,
                      color: 'var(--color-gold-primary)',
                      letterSpacing: '0.18em',
                      textTransform: 'uppercase',
                    }}
                  >
                    Prévia Oficial do Card do Lutador
                  </span>

                  <div
                    style={{
                      width: '110px',
                      height: '110px',
                      borderRadius: '50%',
                      padding: '3px',
                      background: 'var(--gradient-gold)',
                      boxShadow: '0 4px 18px rgba(212, 175, 55, 0.4)',
                    }}
                  >
                    <img
                      src={avatarResult.previewUrl}
                      alt="Prévia do Card"
                      style={{
                        width: '100%',
                        height: '100%',
                        borderRadius: '50%',
                        objectFit: 'cover',
                        display: 'block',
                      }}
                    />
                  </div>

                  <div style={{ textAlign: 'center' }}>
                    <h3
                      style={{
                        fontSize: 'var(--font-size-base)',
                        fontWeight: 900,
                        fontFamily: 'var(--font-family-heading)',
                        color: '#ffffff',
                        letterSpacing: '0.04em',
                        textTransform: 'uppercase',
                      }}
                    >
                      {nickname || 'Seu Apelido'}
                    </h3>
                    <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                      {fullName || 'Nome do Atleta'}
                    </p>
                    <div
                      style={{
                        marginTop: '6px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '4px 10px',
                        borderRadius: 'var(--radius-sm)',
                        backgroundColor: 'rgba(212, 175, 55, 0.1)',
                        border: '1px solid rgba(212, 175, 55, 0.3)',
                        fontSize: 'var(--font-size-xs)',
                        color: 'var(--color-gold-light)',
                        fontWeight: 700,
                      }}
                    >
                      <span>{detectedCategory?.name || 'Aguardando peso...'}</span>
                      {declaredWeight && <span>• {declaredWeight} kg</span>}
                    </div>
                  </div>

                  <span
                    style={{
                      display: 'block',
                      fontSize: '0.72rem',
                      color: 'var(--color-text-muted)',
                      textDecoration: 'underline',
                      marginTop: '4px',
                    }}
                  >
                    Toque para escolher outra foto
                  </span>
                </div>
              ) : (
                <>
                  <Upload size={28} color="var(--color-gold-primary)" />
                  <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: 700, color: '#fff' }}>
                    Toque para enviar sua foto
                  </span>
                  <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
                    JPG, PNG ou WebP até 15MB (comprimida automaticamente para ~150KB)
                  </span>
                </>
              )}
            </div>
          </div>
        </Card>

        {/* Seção Condicional: Menor de Idade (ECA & LGPD) */}
        {isMinor && (
          <Card title="3. Responsável Legal (Atleta Menor de 18 Anos)" headerAccent="red">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: 'var(--space-3)' }}>
              <ShieldAlert size={18} color="var(--color-red-primary)" />
              <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-red-light)', fontWeight: 600 }}>
                Participante menor de idade detectado. Exige anuência legal completa.
              </span>
            </div>

            <InputField
              label="Nome Completo do Responsável Legal"
              placeholder="Ex: Marcos Silva"
              value={guardianName}
              onChange={(e) => setGuardianName(e.target.value)}
              required
            />

            <InputField
              label="Grau de Parentesco / Vínculo"
              placeholder="Ex: Pai, Mãe, Tutor Legal"
              value={guardianRelationship}
              onChange={(e) => setGuardianRelationship(e.target.value)}
              required
            />

            <InputField
              label="Telefone / WhatsApp do Responsável"
              placeholder="(11) 98888-7777"
              value={guardianPhone}
              onChange={(e) => setGuardianPhone(e.target.value)}
              required
            />

            <InputField
              label="Documento do Responsável (RG ou CPF)"
              placeholder="Número confidencial"
              value={guardianDoc}
              onChange={(e) => setGuardianDoc(e.target.value)}
              helperText="Armazenado sob sigilo e acessível somente pelo Administrador Principal."
              required
            />
          </Card>
        )}

        {/* Código de Convite Restrito (quando configurado no evento) */}
        {eventData.requires_invite && (
          <Card title="Código de Convite Exclusivo">
            <InputField
              label="Código de Acesso do Evento"
              placeholder="Digite o código recebido no convite"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value)}
              required
            />
          </Card>
        )}

        {/* Seção de Consentimentos */}
        <Card title="Termos e Consentimentos Obrigatórios">
          <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', cursor: 'pointer', marginBottom: 'var(--space-3)' }}>
            <input
              type="checkbox"
              checked={imageConsent}
              onChange={(e) => setImageConsent(e.target.checked)}
              required
              style={{ marginTop: '4px', accentColor: 'var(--color-gold-primary)' }}
            />
            <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)', lineHeight: 1.4 }}>
              Autorizo a gravação, transmissão e uso da minha imagem nas mídias e vídeos da U.C.U Arena.
            </span>
          </label>

          <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={termsConsent}
              onChange={(e) => setTermsConsent(e.target.checked)}
              required
              style={{ marginTop: '4px', accentColor: 'var(--color-gold-primary)' }}
            />
            <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)', lineHeight: 1.4 }}>
              Declaro que estou ciente dos riscos de combate esportivo e concordo com o regulamento oficial.
            </span>
          </label>
        </Card>

        {/* Botão de Envio */}
        <Button
          variant="gold"
          size="lg"
          fullWidth
          isLoading={isSubmitting}
          type="submit"
        >
          Confirmar e Enviar Inscrição
        </Button>
      </form>
    </div>
  );
};
