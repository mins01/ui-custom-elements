
export default class MultiFormControlWrapper extends HTMLElement {
  static formAssociated = true;

  static define(name = 'multi-form-control-wrapper') {
    customElements.define(name, this);
  }

  static get observedAttributes() {
    return ['value', 'required', 'max'];
  }

  constructor() {
    super();

    this.internals = this.attachInternals();

    this.initialized = false;
    // this.container = null;
    this.wrap = null;

    // 입력 이벤트
    this.addEventListener('input', (event) => {
      if (!this.formControls) return;

      this.updateValidity();
      this.syncFormValue();
      this.setAttribute('value',this.value)

      if (this.checkAppendable()) {
        this.appendFormControl();
      }
    });

    // select 등의 변경 이벤트
    this.addEventListener('change', () => {
      this.updateValidity();
      this.syncFormValue();

      if (this.checkAppendable()) {
        this.appendFormControl();
      }
    });

    // 포커스가 빠져나갈 때 빈 요소 정리
    this.addEventListener('focusout', () => {
      this.trimFormControls();
      this.updateValidity();
      this.syncFormValue();
    });
  }

  connectedCallback() {
    if (!this.initialized) {
      this.initFormControls(this.getAttribute('value'));
      this.initialized = true;
    }

    this.updateValidity();
    this.syncFormValue();
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue === newValue) return;
    if (!this.initialized) return;

    if (name === 'value') {
      this.syncFormValue();
    }

    if (name === 'value' || name === 'required') {
      this.updateValidity();
    }

    if (name === 'max' && this.formControls.length > this.max) {
      // 최대 개수를 줄인 경우 초과 요소 정리
      while (this.formControls.length > this.max) {
        this.formControls[this.formControls.length - 1].remove();
      }

      this.updateValidity();
      this.syncFormValue();
    }
  }

  // 최대 입력 요소 개수
  get max() {
    if (!this.hasAttribute('max')) {
      return Infinity;
    }

    const max = Number(this.getAttribute('max'));

    return Number.isInteger(max) && max >= 0 ? max : Infinity;
  }

  set max(value) {
    this.setAttribute('max', value);
  }

  // 필수 입력 여부
  get required() {
    return this.hasAttribute('required');
  }

  set required(value) {
    this.toggleAttribute('required', Boolean(value));
  }

  // 외부 template
  get templateFormControl() {
    return this.querySelector(':scope > template');
  }

  // 내부 입력 요소
  get formControls() {
    return this.wrap
      ? this.wrap.querySelectorAll(':scope > :is(input, select, textarea)')
      : [];
  }

  // 입력된 값 목록
  get values() {
    return [...this.formControls]
      .map(element => element.value.trim())
      .filter(value => value !== '');
  }

  get value() {
    return this.values.join(',');
  }

  set value(newValue) {
    this.initFormControls(newValue)
    if(this.getAttribute('value') !== this.value){
      this.setAttribute('value',this.value)
    }
  }

  // 초기화
  initFormControls(text=null) {
    // 외부 template이 없으면 기본 template 생성
    if (!this.templateFormControl) {
      const template = document.createElement('template');

      template.innerHTML = `
        <input type="text" class="form-field">
      `;

      this.appendChild(template);
    }


    // 입력 요소를 담을 영역
    this.wrap = document.createElement('div');
    this.wrap.className = 'multi-form-wrap';
    this.appendChild(this.wrap);

    this.clearFormControls();


    if(text){
        const values = text?.split(',') || [];
        values
          .map(v => v.trim())
          .filter(Boolean)
          .forEach(v => this.appendFormControl(v));
    }

    if (this.max > 0) {
      this.appendFormControl();
    }
    this.syncFormValue();    
  }

  // 입력 요소 추가
  appendFormControl(value=null) {
    const template = this.templateFormControl;

    if (!template) {
      throw new Error('Form control template not found.');
    }

    if (this.formControls.length >= this.max) {
      return;
    }

    const clone = template.content.cloneNode(true);
    if(value) clone.querySelector('input, select, textarea').value = value;
    this.wrap.appendChild(clone);
  }

  // 입력 요소 전체 삭제
  clearFormControls() {
    this.wrap.innerHTML = '';
  }

  // 추가 가능 여부
  checkAppendable() {
    const formControls = this.formControls;

    if (formControls.length >= this.max) {
      return false;
    }

    if (formControls.length === 0) {
      return true;
    }

    return formControls[formControls.length - 1].value.trim() !== '';
  }

  // 불필요한 빈 입력 요소 제거
  trimFormControls() {
    const formControls = this.formControls;

    formControls.forEach((element, index) => {
      if (
        element.value.trim() === '' &&
        index < formControls.length - 1
      ) {
        element.remove();
      }
    });
  }

  // FormData 동기화
  syncFormValue() {
    if(this.values.length){
      const formData = new FormData();
      this.values.forEach(value => { formData.append(this.getAttribute('name'), value);});
      this.internals.setFormValue(formData);
    }else{
      // 빈 문자열 처리 안함. 값이 없으면 null 임. 전송 안하도록 설정.
      // formData.append(this.getAttribute('name'), ''); 
      this.internals.setFormValue(null);
    }
  }



  // 유효성 검사
  updateValidity() {
    if (!this.wrap) return;

    const invalidControl = [...this.formControls]
      .find(element => !element.value.trim());

    if (this.required && this.values.length === 0) {
      this.internals.setValidity(
        { valueMissing: true },
        '이 항목은 필수 입력입니다.',
        invalidControl || undefined
      );
    } else {
      this.internals.setValidity({});
    }
  }
}
