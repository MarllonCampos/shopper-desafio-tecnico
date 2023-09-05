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
    const errorString = String(error);
    Swal.close();
    Swal.fire({
      icon: 'error',
      text: errorString,
      timer: 3000,
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
}
