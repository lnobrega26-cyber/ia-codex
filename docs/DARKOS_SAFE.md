# DarkOS — versão segura para IA CODEX

Este documento regista a ideia visual e organizacional do pacote DarkOS sem importar ou executar os scripts e módulos perigosos do arquivo original.

## Estado da análise

O ZIP original contém código e comandos para manipulação de chamadas do sistema, ocultação de rastos, execução persistente como root, alteração do arranque, e transmissão de dados para servidores externos. Esses ficheiros não foram copiados para este repositório nem serão executados.

## Funcionalidades seguras que podem ser desenvolvidas

- **Painel DarkOS:** interface escura para apresentar o estado da aplicação.
- **Terminal demonstrativo:** comandos fictícios limitados à própria interface, sem executar comandos do sistema operativo.
- **Explorador demonstrativo:** lista de ficheiros de exemplo guardados apenas na interface.
- **Monitor de estado:** apresenta informações não sensíveis e disponibilizadas voluntariamente pelo navegador.
- **Cofre local opcional:** armazenamento de notas de demonstração no próprio navegador, com aviso claro sobre as suas limitações.
- **Chat IA CODEX:** acesso ao modelo local no navegador quando o dispositivo suporta WebGPU.

## Regras de segurança

1. Não instalar módulos de kernel nem alterar chamadas do sistema.
2. Não criar mecanismos de persistência ou execução oculta.
3. Não apagar, adulterar ou esconder registos do sistema.
4. Não recolher nem enviar ficheiros ou dados sem ação explícita do utilizador.
5. Não executar comandos privilegiados nem modificar o arranque do computador.

## Conteúdo original

Os ficheiros executáveis do ZIP foram deliberadamente excluídos. Este documento é uma adaptação segura da ideia, não uma cópia funcional do DarkOS original.
