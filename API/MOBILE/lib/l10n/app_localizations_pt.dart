// ignore: unused_import
import 'package:intl/intl.dart' as intl;
import 'app_localizations.dart';

// ignore_for_file: type=lint

/// The translations for Portuguese (`pt`).
class AppLocalizationsPt extends AppLocalizations {
  AppLocalizationsPt([String locale = 'pt']) : super(locale);

  @override
  String get appTitle => 'SMARTUR';

  @override
  String get settingsTitle => 'Configurações';

  @override
  String get appearanceSection => 'Aparência';

  @override
  String get accountSection => 'Conta';

  @override
  String get infoSection => 'Informações';

  @override
  String get darkMode => 'Modo escuro';

  @override
  String get language => 'Idioma';

  @override
  String get changePassword => 'Alterar senha';

  @override
  String get editName => 'Editar nome';

  @override
  String get deleteAccount => 'Excluir conta';

  @override
  String get appVersion => 'Versão do app';

  @override
  String get termsAndConditions => 'Termos e Condições';

  @override
  String get registerAcceptTermsPrefix => 'Aceito os ';

  @override
  String get termsMustAccept =>
      'Você precisa aceitar os termos e condições para se cadastrar.';

  @override
  String get termsCloseButton => 'Entendi';

  @override
  String get termsAndConditionsBody =>
      'Última atualização: março de 2025.\n\n1. Objeto\nO SMARTUR é um aplicativo móvel para explorar destinos turísticos, recomendações e recursos de comunidade.\n\n2. Cadastro e conta\nAo criar uma conta, você confirma que as informações são verdadeiras. Você é responsável por manter a confidencialidade da senha e pelas atividades na sua conta.\n\n3. Uso permitido\nVocê se compromete a usar o serviço de forma lícita, sem violar direitos de terceiros ou o funcionamento da plataforma.\n\n4. Conteúdo e propriedade intelectual\nO conteúdo do app (textos, design, marcas) é protegido. Não é permitida a reprodução não autorizada.\n\n5. Dados pessoais\nO tratamento dos seus dados pessoais segue a legislação aplicável. Ao usar o SMARTUR, você aceita as práticas descritas na política de privacidade do serviço.\n\n6. Alterações\nPodemos atualizar estes termos. Mudanças relevantes serão comunicadas por meios razoáveis; o uso continuado após a atualização implica aceitação dos novos termos.\n\n7. Contato\nPara dúvidas sobre estes termos, use os canais de suporte indicados no aplicativo ou no site oficial.';

  @override
  String get logout => 'Sair';

  @override
  String get selectLanguage => 'Selecionar idioma';

  @override
  String get systemLanguage => 'Idioma del sistema';

  @override
  String get systemTheme => 'Tema del sistema';

  @override
  String get cancel => 'Cancelar';

  @override
  String get save => 'Salvar';

  @override
  String get deleteAccountTitle => 'Excluir conta';

  @override
  String get deleteAccountConfirm =>
      'Tem certeza de que deseja excluir sua conta? Esta ação é irreversível e você perderá seu histórico de viagens.';

  @override
  String get deleteAccountYes => 'Sim, excluir';

  @override
  String get editNameTitle => 'Editar nome';

  @override
  String get yourName => 'Seu nome';

  @override
  String get changePasswordTitle => 'Alterar senha';

  @override
  String get changePasswordStep0Hint =>
      'Enviaremos um código de verificação para o seu e-mail.';

  @override
  String get changePasswordStep1Hint => 'Digite o código e sua nova senha.';

  @override
  String get verificationCode => 'Código de verificação';

  @override
  String get newPassword => 'Nova senha';

  @override
  String get confirmPassword => 'Confirmar senha';

  @override
  String get sendCode => 'Enviar código';

  @override
  String get updatePassword => 'Atualizar senha';

  @override
  String get resendCode => 'Reenviar código';

  @override
  String get codeSixDigits => 'Código de 6 dígitos';

  @override
  String get passwordMinChars => 'Mínimo de 8 caracteres';

  @override
  String get passwordNeedUpper => 'Inclua pelo menos uma letra maiúscula';

  @override
  String get passwordNeedLower => 'Inclua pelo menos uma letra minúscula';

  @override
  String get passwordNeedNumber => 'Inclua pelo menos um número';

  @override
  String get passwordsDontMatch => 'As senhas não coincidem';

  @override
  String codeSentToEmail(Object email) {
    return 'Código enviado para $email';
  }

  @override
  String get emailNotFound => 'E-mail não encontrado';

  @override
  String get loading => 'Carregando...';

  @override
  String get welcomeBack => 'Bem-vindo de volta';

  @override
  String get startNow => 'Começar';

  @override
  String get loginSubtitle => 'Digite suas credenciais para continuar.';

  @override
  String get registerSubtitle =>
      'Cadastre-se para descobrir rotas personalizadas.';

  @override
  String get continueWithEmail => 'Continuar com e-mail';

  @override
  String get registerWithEmail => 'Cadastrar com e-mail';

  @override
  String get tagline => 'IA que guia, turismo que une';

  @override
  String get start => 'Começar';

  @override
  String get loginWithBiometrics => 'Entrar com impressão digital';

  @override
  String get navHome => 'Início';

  @override
  String get navDiary => 'Diário';

  @override
  String get navRecommend => 'Recomendar';

  @override
  String get navCommunity => 'Comunidade';

  @override
  String get navUser => 'Usuário';

  @override
  String get communityTitle => 'Comunidade';

  @override
  String get uploadPhotoAction => 'Adicionar foto';

  @override
  String get communityCreatePost => 'Criar publicação';

  @override
  String get communityPostCaptionHint => 'O que você quer compartilhar?';

  @override
  String get communitySelectPlace => 'Local marcado';

  @override
  String get communitySelectPlaceHint =>
      'Escolha o local sobre o qual você publica';

  @override
  String get communityAttachImage => 'Anexar imagem';

  @override
  String get communityRemoveImage => 'Remover imagem';

  @override
  String get communityPublish => 'Publicar';

  @override
  String get communityNeedPlace => 'Selecione um local';

  @override
  String get communityNeedTextOrImage =>
      'Escreva uma mensagem ou anexe uma imagem';

  @override
  String get communityLoadPlacesError => 'Não foi possível carregar os locais';

  @override
  String get communityPostPublished => 'Publicação criada';

  @override
  String get diaryTitle => 'Meu Diário';

  @override
  String get favoritesTab => 'Favoritos';

  @override
  String get historyTab => 'Histórico';

  @override
  String get offlineAvailable => 'Disponível offline';

  @override
  String recommendationsInCity(Object city) {
    return 'Recomendações em $city';
  }

  @override
  String recommendationNumber(Object number) {
    return 'Recomendação #$number';
  }

  @override
  String recommendationSubtitle(Object city) {
    return 'Sugerido pela IA da SMARTUR para sua visita a $city.';
  }

  @override
  String get mapDiscoverHint =>
      'Descubra pontos-chave sem rastrear sua localização em tempo real.';

  @override
  String get mapTapPinHint =>
      'Toque em um pin para ver detalhes gerados por IA';

  @override
  String get filterAll => 'Todos';

  @override
  String get filterMuseums => 'Museus';

  @override
  String get filterCafes => 'Cafés';

  @override
  String get filterViewpoints => 'Mirantes';

  @override
  String get filterMuseumsOnly => 'Somente museus';

  @override
  String get aiSmartur => 'IA Smartur';

  @override
  String get enableBiometricsHint =>
      'Faça login e ative a impressão digital no seu perfil';

  @override
  String get deviceNotSupported => 'Dispositivo não compatível';

  @override
  String get noBiometricsEnrolled => 'Nenhuma impressão digital cadastrada';

  @override
  String get biometricReason => 'Acesse suas rotas da SMARTUR';

  @override
  String get sessionExpired => 'Sessão expirada. Faça login novamente.';

  @override
  String get biometricReadError => 'Erro ao ler a impressão digital.';

  @override
  String get quickAccess => 'Acesso rápido';

  @override
  String get activate => 'Ativar';

  @override
  String get notNow => 'Agora não';

  @override
  String get dontRemindMe => 'Não me lembre mais';

  @override
  String get biometricPrompt =>
      'Deseja usar sua impressão digital para fazer login mais rápido na próxima vez?';

  @override
  String get biometricActivateReason =>
      'Confirme sua impressão digital para ativar o acesso rápido';

  @override
  String get biometricActivateTitle => 'Ativar impressão digital — SMARTUR';

  @override
  String get biometricTouchSensor => 'Toque o sensor';

  @override
  String get biometricActivated => 'Acesso por impressão digital ativado';

  @override
  String biometricActivateError(Object error) {
    return 'Não foi possível ativar: $error';
  }

  @override
  String get biometricDeactivated =>
      'A impressão digital não será mais solicitada';

  @override
  String get biometricConfirmActivate =>
      'Confirme sua impressão digital para ativar';

  @override
  String get biometricCouldNotActivate =>
      'Não foi possível ativar a impressão digital';

  @override
  String get myProfile => 'Meu perfil';

  @override
  String get manageAccount => 'Gerencie sua conta rapidamente';

  @override
  String get myPreferences => 'Minhas preferências';

  @override
  String get yourPreferences => 'Suas preferências';

  @override
  String get noPreferencesSaved => 'Você ainda não salvou preferências.';

  @override
  String get confirmChangePreferences =>
      'Tem certeza de que deseja alterá-las?';

  @override
  String get change => 'Alterar';

  @override
  String get fingerprintAccess => 'Acesso por impressão digital';

  @override
  String get configuration => 'Configurações';

  @override
  String exploreGreeting(Object name) {
    return 'Explorar$name';
  }

  @override
  String get highMountainsVeracruz => 'Altas Montañas, Veracruz';

  @override
  String get exploreHighMountains => 'Explore as Altas Montanhas';

  @override
  String recommendationsForYou(Object name) {
    return 'Recomendações para você, $name';
  }

  @override
  String get weatherNow => 'Clima agora';

  @override
  String get notAvailable => 'Não disponível';

  @override
  String get allCategories => 'Todos';

  @override
  String get noCategoryPlaces => 'Nenhum lugar nesta categoria ainda';

  @override
  String get exploreNoCities => 'Nenhuma cidade com lugares do servidor.';

  @override
  String get exploreCouldNotLoad =>
      'Não foi possível carregar os lugares. Verifique a conexão.';

  @override
  String get exploreAllCities => 'Todas as cidades';

  @override
  String get tabHistory => 'História';

  @override
  String get tabLocation => 'Localização';

  @override
  String get tabGastronomy => 'Gastronomia';

  @override
  String get tabAiSummary => 'Resumo IA';

  @override
  String get fromPrice => 'A partir de';

  @override
  String get free => 'Grátis';

  @override
  String get createOneDayRoute => 'Criar Rota de 1 Dia';

  @override
  String get tabLocationPlaceholder => 'Mapa e pontos principais para visitar.';

  @override
  String get tabGastronomyPlaceholder =>
      'Pratos típicos e cafés recomendados da região.';

  @override
  String get tabAiPlaceholder =>
      'Resumo gerado por IA com avaliações e notas de outros turistas.';

  @override
  String get invalidCredentials => 'Credenciais inválidas.';

  @override
  String get invalidCode => 'Código inválido ou expirado.';

  @override
  String get tooManyAttempts =>
      'Muitas tentativas. Tente novamente em 1 minuto.';

  @override
  String get accountCreated => 'Conta criada com sucesso. Faça login.';

  @override
  String get connectionError => 'Erro de conexão.';

  @override
  String get changeEmail => 'Alterar e-mail';

  @override
  String get confirmLogoutTitle => 'Sair';

  @override
  String get confirmLogoutMessage => 'Tem certeza de que deseja sair?';

  @override
  String get next => 'Próximo';

  @override
  String get back => 'Voltar';

  @override
  String get sustainablePreferences => 'Preferências sustentáveis';

  @override
  String get sessionExpiredPreferences =>
      'Sessão expirada. Faça login novamente.';

  @override
  String get profileReady =>
      'Perfil pronto! Agora daremos recomendações sob medida 🎉';

  @override
  String get couldNotSavePreferences =>
      'Não foi possível salvar as preferências. Tente novamente.';

  @override
  String get selectGender => 'Selecione seu gênero';

  @override
  String get selectAtLeastOneInterest => 'Selecione pelo menos um interesse';

  @override
  String get completeAllFields => 'Preencha todos os campos';

  @override
  String get categoryHotels => 'Hotelaria';

  @override
  String get categoryRestaurants => 'Restaurantes';

  @override
  String get categoryMuseums => 'Museus';

  @override
  String get categoryAdventures => 'Aventuras';

  @override
  String get tourist => 'turista';

  @override
  String get codeSentToLabel => 'Um código foi enviado para:';

  @override
  String get enterSixDigitCode => 'Digite o código de 6 dígitos';

  @override
  String get rememberMe7Days => 'Lembrar-me por 7 dias neste dispositivo';

  @override
  String get verify => 'VERIFICAR';

  @override
  String get signInButton => 'ENTRAR';

  @override
  String get createAccount => 'CRIAR CONTA';

  @override
  String get continueWithGoogle => 'Continuar com Google';

  @override
  String get noAccountPrompt => 'Não tem uma conta? ';

  @override
  String get haveAccountPrompt => 'Já tem uma conta? ';

  @override
  String get signUp => 'Cadastre-se';

  @override
  String get signInAction => 'Faça login';

  @override
  String get fullName => 'Nome completo';

  @override
  String get enterFullName => 'Digite seu nome completo';

  @override
  String get minThreeChars => 'Mínimo 3 caracteres';

  @override
  String get emailAddress => 'Endereço de e-mail';

  @override
  String get enterEmail => 'Digite seu e-mail';

  @override
  String get enterValidEmail => 'Digite um e-mail válido';

  @override
  String get password => 'Senha';

  @override
  String get enterPassword => 'Digite sua senha';

  @override
  String get minEightChars => 'Mínimo de 8 caracteres';

  @override
  String get atLeastOneUppercase => 'Pelo menos uma letra maiúscula';

  @override
  String get atLeastOneLowercase => 'Pelo menos uma letra minúscula';

  @override
  String get atLeastOneNumber => 'Pelo menos um número';

  @override
  String get atLeastOneSpecial => 'Pelo menos um caractere especial';

  @override
  String get passwordRequirements => 'A senha deve ter:';

  @override
  String get specialCharHint => 'Um caractere especial (!@#\$%^&*)';

  @override
  String get strengthVeryWeak => 'Muito fraca';

  @override
  String get strengthWeak => 'Fraca';

  @override
  String get strengthFair => 'Regular';

  @override
  String get strengthStrong => 'Forte';

  @override
  String get strengthVeryStrong => 'Muito forte';

  @override
  String get defaultUserName => 'Turista SMARTUR';

  @override
  String get myInterests => 'Meus Interesses';

  @override
  String get quickSettings => 'Configurações rápidas';

  @override
  String memberSince(Object date) {
    return 'Membro desde $date';
  }

  @override
  String get notifications => 'Notificações';

  @override
  String get notificationsSubtitle =>
      'Gerencie alertas de clima, rotas e comunidade';

  @override
  String get appPreferences => 'Preferências do app';

  @override
  String get appPreferencesSubtitle => 'Idioma, unidades e tema visual';

  @override
  String get editProfile => 'Editar perfil';

  @override
  String get editProfileSubtitle =>
      'Altere sua foto de perfil ou escolha um ícone';

  @override
  String get profilePhotoFormatsHint =>
      'Formatos: JPEG, PNG, GIF, WebP ou HEIC. Máximo 5 MB.';

  @override
  String get profilePhotoInvalidFormat =>
      'Formato não permitido. Use JPEG, PNG, GIF, WebP ou HEIC.';

  @override
  String get profilePhotoTooLarge => 'A imagem excede 5 MB.';

  @override
  String get profileOpenGallery => 'Galeria';

  @override
  String get profileOpenCamera => 'Câmera';

  @override
  String get removeProfilePhoto => 'Remover foto';

  @override
  String get avatarIconsSectionHint => 'Ou escolha um ícone em vez de foto';

  @override
  String get changePasswordSubtitle => 'Atualize sua senha de acesso';

  @override
  String get forgotPassword => '¿Olvidaste tu contraseña?';

  @override
  String get sessionClosed => 'Sessão encerrada';

  @override
  String stepXOfY(Object current, Object total) {
    return 'Passo $current de $total';
  }

  @override
  String get stepAboutYou => 'Sobre você';

  @override
  String get stepAboutYouSubtitle => 'Conte-nos um pouco sobre você';

  @override
  String get stepYourTastes => 'Seus gostos';

  @override
  String get stepYourTastesSubtitle => 'O que você ama fazer';

  @override
  String get stepDetails => 'Detalhes';

  @override
  String get stepDetailsSubtitle => 'Últimas preferências';

  @override
  String get birthYear => 'Data de nascimento';

  @override
  String get enterBirthYear => 'Selecione sua data de nascimento';

  @override
  String get invalidYear => 'Data inválida';

  @override
  String get gender => 'Gênero';

  @override
  String get genderMale => 'Masculino';

  @override
  String get genderFemale => 'Feminino';

  @override
  String get genderNonBinary => 'Não binário';

  @override
  String get genderPreferNotToSay => 'Prefiro não dizer';

  @override
  String get yourInterests => 'Seus interesses';

  @override
  String get activityLevel => 'Nível de atividade';

  @override
  String get travelType => 'Tipo de viagem';

  @override
  String get preferredPlace => 'Lugar preferido';

  @override
  String get interestCulture => 'Cultura';

  @override
  String get interestGastronomy => 'Gastronomia';

  @override
  String get interestAdventure => 'Aventura';

  @override
  String get interestNature => 'Natureza';

  @override
  String get interestHistory => 'História';

  @override
  String get interestPhotography => 'Fotografia';

  @override
  String get interestSports => 'Esportes';

  @override
  String get interestWellness => 'Bem-estar';

  @override
  String get interestArt => 'Arte';

  @override
  String get interestNightlife => 'Vida noturna';

  @override
  String get activityLow => 'Baixo';

  @override
  String get activityModerate => 'Moderado';

  @override
  String get activityHigh => 'Alto';

  @override
  String get activityExtreme => 'Extremo';

  @override
  String get travelBackpacker => 'Mochileiro';

  @override
  String get travelFamily => 'Familiar';

  @override
  String get travelLuxury => 'Luxo';

  @override
  String get travelAdventure => 'Aventura';

  @override
  String get travelRomantic => 'Romântico';

  @override
  String get travelBusiness => 'Negócios';

  @override
  String get placeBeach => 'Praia';

  @override
  String get placeMountain => 'Montanha';

  @override
  String get placeCity => 'Cidade';

  @override
  String get placeCountryside => 'Campo';

  @override
  String get placeForest => 'Floresta';

  @override
  String get placeDesert => 'Deserto';

  @override
  String get needAccessibility => 'Precisa de acessibilidade especial?';

  @override
  String get accessibilitySubtitle =>
      'Rotas adaptadas para mobilidade reduzida ou outras necessidades';

  @override
  String get describeNeedOptional => 'Descreva sua necessidade (opcional)';

  @override
  String get accessibilityHint => 'Ex: cadeira de rodas, bengala...';

  @override
  String get visitedHighMountains => 'Já visitou as Altas Montanhas?';

  @override
  String get visitedSubtitle =>
      'Isso nos ajuda a personalizar melhor suas recomendações';

  @override
  String get dietaryRestrictions => 'Restrições alimentares ou médicas';

  @override
  String get dietaryHint =>
      'Ex: vegetariano, alergia a frutos do mar... (deixe vazio se nenhuma)';

  @override
  String get sustainableNoPref => 'Sem preferência';

  @override
  String get sustainableLow => 'Prioridade baixa';

  @override
  String get sustainableMedium => 'Prioridade média';

  @override
  String get sustainableHigh => 'Prioridade alta';

  @override
  String get choosePreference => 'Escolha o que você mais prefere';

  @override
  String get dateFormatPlaceholder => 'Dia / Mês / Ano';
}
