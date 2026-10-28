import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Card } from '../../components/common/Card';
import { InputField } from '../../components/common/InputField';
import { Button } from '../../components/common/Button';
import { BrandLogo } from '../../components/common/BrandLogo';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { ShieldCheck, User } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { loginWithNickname } = useAuth();
  const { showToast } = useToast();

  const [nickname, setNickname] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Destino pós-login
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/atleta';

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nickname.trim() || !password) {
      showToast('Por favor, informe seu apelido e senha.', 'warning');
      return;
    }

    setIsLoading(true);
    const result = await loginWithNickname(nickname, password);
    setIsLoading(false);

    if (result.error) {
      showToast(result.error, 'error');
    } else {
      // Ativa a animação cinematográfica de boas-vindas pós-login
      sessionStorage.setItem('ucu_login_welcome', 'true');
      showToast('Acesso concedido com sucesso!', 'success');
      navigate(from, { replace: true });
    }
  };

  return (
    <div
      className="animate-slide-up"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'var(--space-6) 0',
      }}
    >
      <div style={{ textAlign: 'center', marginBottom: 'var(--space-6)' }}>
        <BrandLogo size="lg" />
        <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)', marginTop: '8px' }}>
          Portal Oficial do Participante e Administração
        </p>
      </div>

      <div style={{ width: '100%', maxWidth: '420px' }}>
        <Card headerAccent="gold">
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column' }}>
            <InputField
              label="Apelido de Combate"
              placeholder="Digite seu apelido"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              leftIcon={<User size={18} />}
              required
            />

            <InputField
              label="Senha"
              placeholder="Digite sua senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              isPassword
              required
            />

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 'var(--space-4)' }}>
              <button
                type="button"
                onClick={() => showToast('Para recuperar o acesso, solicite o envio do link pelo apelido cadastrado.', 'info')}
                style={{
                  background: 'transparent',
                  border: 'none',
                  fontSize: 'var(--font-size-xs)',
                  color: 'var(--color-gold-primary)',
                  cursor: 'pointer',
                  fontWeight: 600,
                }}
              >
                Esqueci minha senha
              </button>
            </div>

            <Button
              variant="gold"
              size="lg"
              fullWidth
              isLoading={isLoading}
              type="submit"
              leftIcon={<ShieldCheck size={18} />}
            >
              Entrar na Arena
            </Button>
          </form>
        </Card>

        {/* Rodapé de Inscrição */}
        <p style={{ textAlign: 'center', marginTop: 'var(--space-5)', fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)' }}>
          Ainda não está inscrito no evento?{' '}
          <a
            href="/e/arena-inaugural/inscrever"
            onClick={(e) => {
              e.preventDefault();
              navigate('/e/arena-inaugural/inscrever');
            }}
            style={{ fontWeight: 700, color: 'var(--color-gold-primary)' }}
          >
            Inscreva-se aqui
          </a>
        </p>
      </div>
    </div>
  );
};
