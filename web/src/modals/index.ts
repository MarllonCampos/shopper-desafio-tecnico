import Swal from 'sweetalert2';

export class Modals {
  static WaitingValidation() {
    Swal.fire({
      title: 'Aguarde',
      text: 'Estamos validando seu arquivo',
      showConfirmButton: false,
      allowEscapeKey: false,
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });
  }

  static FileValidationSuccess() {
    Swal.close();
    Swal.fire({
      icon: 'success',
      title: 'Arquivo conferido com sucesso',
      timer: 3000,
      timerProgressBar: true,
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static ErrorWhileValidating(error: any) {
    const errorString = String(error.message);
    console.log(error);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const notices = error.data.map((errorInfo: any) => `${errorInfo.reason}`).join('\n');

    Swal.close();
    Swal.fire({
      icon: 'error',
      title: errorString,
      text: notices,
    });
  }

  static ErrorWhileParsing() {
    Swal.fire({
      icon: 'error',
      title: 'Erro!',
      text: 'Houve um erro tentando converter seu arquivo, verifique-o novamente',
    });
  }

  static WarningFileIsRequired() {
    Swal.fire({
      icon: 'warning',
      title: 'Aviso',
      text: 'O arquivo é obrigatório',
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static ErrorWhileUpdating(error: any) {
    Swal.close();

    Swal.fire({
      icon: 'error',
      title: error.message,
    });
  }

  static ErrorOnProducts(reasons: string[]) {
    const reasonsList = document.createElement('ul');

    // Preencha a lista com os reasons
    reasons.forEach((reasonItem) => {
      const listItem = document.createElement('li');
      listItem.textContent = `${reasonItem}`;
      listItem.style.fontSize = '14px';
      reasonsList.appendChild(listItem);
    });
    Swal.fire({
      icon: 'error',
      titleText: 'Error',
      html: reasonsList,
      text: reasons.join('\n'),
    });
  }

  static FileUpdatingSuccess() {
    Swal.close();
    Swal.fire({
      icon: 'success',
      title: 'Produtos Atualizados com Sucesso',
    });
  }
}
