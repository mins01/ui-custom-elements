
export default class MultiFormControl extends HTMLElement {
  static formAssociated = true;

  static define(name='multi-form-control'){
    customElements.define(name, this);
  }

  static shadowRootHtml = `<style>
      :host {
          display: inline-block;
          width:100%;
      }
      .host{
          border:1px solid #999;
          padding:4px;
      }
      .wrap{
          display: flex;
          flex-wrap: wrap;
          gap: 4px;
      }
      .form-field{
          min-width: 6em;
          field-sizing: content;
          line-height: 1.5em;
      }
      </style>
      <div class="container">
          <slot name="slot-template">
            <template class="template-form-field" part="template-form-field">
              <input class="form-field" type="text" part="form-field">
            </template>
          </slot>
          <div class="wrap">
              <input class="form-field" type="text">
              <input class="form-field" type="text">
              <input class="form-field" type="text">
          </div>
      </div>
    `

  constructor() {
    super();

    this.internals = this.attachInternals();
    
    

    const shadowRoot = this.attachShadow({ mode: 'open' });

    shadowRoot.innerHTML = this.constructor.shadowRootHtml;
    this.container = shadowRoot.querySelector('.container')
    this.wrap = shadowRoot.querySelector('.wrap')

    this.container.addEventListener('focusout',(event)=>{
      this.trimFormControls();
      this.updateValidity();
      this.syncFormValue();
    })
    this.container.addEventListener('input',(event)=>{
      this.updateValidity();
      this.syncFormValue()
      if(this.checkAppendable()){
        this.appendFormControl();
      }
    })
    this.addEventListener('input',(event)=>{
      this.updateValidity();
      this.syncFormValue()
      if(this.checkAppendable()){
        this.appendFormControl();
      }
    })
  }
  

  get max() {
    return Number(this.getAttribute('max')) || Infinity;
  }

  set max(value) {
    this.setAttribute('max', value);
  }

  static get observedAttributes() {
    return ['value','required', 'max'];
  }

  connectedCallback() {
    this.initFormControls();
    this.updateValidity();
    this.internals.setFormValue('');
    
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue === newValue) return;

    if (name === 'value' || name === 'required') {
      this.updateValidity();
    }

    if (name === 'value') {
      this.syncFormValue();
    }
  }

  get templateFormControl(){
    // return this.container.querySelector('template')
    return this.querySelector('template[slot="slot-template"]') || this.shadowRoot.querySelector('.template-form-field');
  }


  get values(){
    return [...this.formControls].map((el)=>{ 
      return el.value.trim();
    }).filter(value => value !== '');;
  }
  get value() {
   return this.values.join(',');
  }

  set value(newValue) {
    // this._value = newValue;
    // this.internals.setFormValue(newValue);
  }

  get required() {
    return this.hasAttribute('required');
  }

  set required(value) {
    this.toggleAttribute('required', Boolean(value));
  }



  syncFormValue(){
    const formData = new FormData();
    this.values.forEach(value => { formData.append(this.getAttribute('name'), value);});
    this.internals.setFormValue(formData);
  }


  updateValidity() {
    const invalidControl = [...this.formControls]
      .find(el => !el.value.trim());

    if (this.required && !this.value) {
      this.internals.setValidity(
        { valueMissing: true },
        '이 항목은 필수 입력입니다.',
        invalidControl
      );
    } else {
      this.internals.setValidity({});
    }
  }




  initFormControls(){
    this.clearFormControls();
    this.appendFormControl();
  }

  appendFormControl(){
    const template = this.templateFormControl;
    if (!template) {
      throw new Error('Form control template not found.');
    }
    const clone = template.content.cloneNode(true);
    this.wrap.appendChild(clone);
  }

  get formControls(){
    return this.wrap.querySelectorAll(':scope > :is(input, select, textarea)');
  }

  clearFormControls(){
    this.wrap.innerHTML='';
  }

  checkAppendable() {
    const formControls = this.formControls;

    // 최대 개수에 도달하면 추가하지 않음
    if (formControls.length >= this.max) {
      return false;
    }

    if (formControls.length === 0) {
      return true;
    }

    return formControls[formControls.length - 1].value.trim() !== '';
  }

  trimFormControls() {
    const formControls = this.formControls;

    formControls.forEach((element, index) => {
      if (element.value.trim() === '' && index < formControls.length - 1) {
        element.remove();
      }
    });
  }
    
}

// customElements.define('dice-6', Dice6Element);
