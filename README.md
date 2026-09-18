# BarberXP v76

Atualização consolidada da Edershow: painel mais limpo, Equipe centralizada,
ranking somente com profissionais reais, evolução antecipada no painel do
barbeiro, ocorrências dentro de Equipe e criação de acessos por função.

Clube, Produtos, Próxima Campanha e Reconhecimentos foram ocultados da
navegação sem apagar o código ou o histórico. Esta versão mantém as correções
anteriores, inclusive notificações, datas retroativas, meta coletiva, ritmo
mensal e gráfico individual.

O push exige a função `supabase/functions/send-push` e o SQL entregue separadamente. Nunca publique a chave VAPID privada no GitHub.

## Base do projeto

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
