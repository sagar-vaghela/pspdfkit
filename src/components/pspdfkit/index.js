import React, { Component } from "react";
import PSPDFKitWeb from "pspdfkit";

let ua;

if (typeof navigator !== "undefined" && navigator.userAgent != null) {
  ua = navigator.userAgent;
}

let isIe = false;

if (ua != null) {
  isIe = ua.indexOf("MSIE ") !== -1 || ua.indexOf("Trident/") !== -1;
}

let dndDataMimeType = !isIe ? "text/plain" : "text";


const insertableAnnotations = [
  {
    type: "text-anno",
    label: "Text (Non-Editable)",
    description:
      "Use a plain text annotation to fill out the blanks above the form (double-click to set the text in advance)",
    icon: "anno_text",
  },

  {
    type: "text-field",
    label: "Text",
    description:
      "Use a text field to allow the signer to fill out the name and date sections within the form area",
    icon: "form_text",
  },

  {
    type: "signature-field",
    label: "Signature",
    description:
      "Use a signature field to allow the signer to fill out the signature section within the form area",
    icon: "form_signature",
  },
];
export default class PSPDFKit extends Component {
  constructor(props, context) {
    super(props, context);
    this._instance = null;
    this._container = null;

    this.onRef = this.onRef.bind(this);
    this.load = this.load.bind(this);
    this.unload = this.unload.bind(this);
    
  }

  onRef(container) {
    this._container = container;
  }

  async load(props) {
    console.log(`Loading ${props.documentUrl}`);

    this._instance = await PSPDFKitWeb.load({
      document: props.documentUrl,
      container: this._container,
      baseUrl: props.baseUrl,
      
    });
    
    console.log("Successfully mounted PSPDFKit", this._instance);

  }
  unload() {
    PSPDFKitWeb.unload(this._instance || this._container);
    this._instance = null;
  }

  componentDidMount() {
    this.load(this.props);
  }

  componentDidUpdate(prevProps) {
    const nextProps = this.props;

    // We only want to reload the document when the documentUrl prop changes.
    if (nextProps.documentUrl !== prevProps.documentUrl) {
      this.unload();
      this.load(nextProps);
    }
  }

  componentWillUnmount() {
    this.unload();
  }
  
  handleInsertableAnnoClick = (event) => {
    // Extract the type from the data-annotation-type attribute
    const type = event.currentTarget.dataset.annotationType;
  
    this.insertAnnotation(type);
  }

  handleInsertableAnnoDragStart = (event) => {
    if (!isIe) {
      event.dataTransfer.dropEffect = "copy";
    }
  
    event.dataTransfer.setData(
      dndDataMimeType,
  
      // We store the annotation type in the event so that we know what type of
      // annotation to insert when the user drops.
      event.currentTarget.dataset.annotationType
    );
  
    event.stopPropagation();
  }

  createFormFieldName = () => {
    return `form-field-${Math.random().toString(36).slice(-5)}`;
  }

  insertAnnotation = (type, position) =>{
    // We need to reference this when creating both the widget annotation and the
    // form field itself, so that they are linked.
    const formFieldName = this.createFormFieldName();
    const widgetProperties = {
      id: PSPDFKitWeb.generateInstantId(),
      pageIndex: this._instance.viewState.currentPageIndex,
      formFieldName,
    };
  
    let left = 30;
    let top = 30;
  
    // The position may or may not be initialized from the drop location from DND.
    if (position != null) {
      left = position.left;
      top = position.top;
    }

    switch (type) {
      case "text-field": {
        const widget = new PSPDFKitWeb.Annotations.WidgetAnnotation({
          ...widgetProperties,
          borderColor: PSPDFKitWeb.Color.BLACK,
          borderWidth: 1,
          borderStyle: "solid",
          backgroundColor: new PSPDFKitWeb.Color({ r: 220, g: 240, b: 255 }),
  
          // This data tells us whether the landlord or tenant can fill in this
          // form field. Otherwise it will be disabled.
          customData: { forSigner: "landlord" },
  
          boundingBox: new PSPDFKitWeb.Geometry.Rect({
            left,
            top,
            width: 225,
            height: 15,
          }),
        });
  
        const formField = new PSPDFKitWeb.FormFields.TextFormField({
          name: formFieldName,
          // Link to the annotation with the ID
          annotationIds: new PSPDFKitWeb.Immutable.List([widget.id]),
        });
  
        this._instance.create([widget, formField]);
        break;
      }
  
      case "signature-field": {
        const widget = new PSPDFKitWeb.Annotations.WidgetAnnotation({
          ...widgetProperties,
          
          
          borderColor: PSPDFKitWeb.Color.BLACK,
          borderWidth: 1,
          borderStyle: "solid",
          backgroundColor: PSPDFKitWeb.Color.WHITE,
          customData: { forSigner: "landlord" },
          boundingBox: new PSPDFKitWeb.Geometry.Rect({
            left,
            top,
            width: 225,
            height: 30,
          }),
        });
  
        const formField = new PSPDFKitWeb.FormFields.SignatureFormField({
          name: formFieldName,
          annotationIds: new PSPDFKitWeb.Immutable.List([widget.id]),
        });
  
        this._instance.create([widget, formField]);
        break;
      }
  
      case "text-anno": {
        // We don't need a form field here since it is just a regular annotation.
  
        this._instance.create(
          new PSPDFKitWeb.Annotations.TextAnnotation({
            pageIndex: this._instance.viewState.currentPageIndex,
            text: "Text Annotation",
            fontSize: 10,
            boundingBox: new PSPDFKitWeb.Geometry.Rect({
              left,
              top,
              width: 100,
              height: 12,
            }),
          })
        );
  
        break;
      }

      default:
        throw new Error(`Can't insert unknown annotation! (${type})`);
    }
  }

  render() {
    return (
      <div className="side-anotations">
        
        {insertableAnnotations.map((insertableAnno) => {
          return (
            <div className="split left side-anotation" key={insertableAnno.type}>
              <div ref={this.onRef}
              style={{ width: "100%", height: "100%",}}
                >
                  <span className="design-phase__side-annotation-label">
                        {insertableAnno.label}
                  </span>
                  <button
                            className="design-phase__side-annotation-button"
                            onClick={this.handleInsertableAnnoClick}
                            data-annotation-type={insertableAnno.type}
                            draggable
                            onDragStart={this.handleInsertableAnnoDragStart}
                          >button
                            <img
                              src={`/form-designer/static/${insertableAnno.icon}.svg`}
                              width="32"
                              className="design-phase__side-annotation-button-icon"
                            />
                    </button>
              </div>
            </div>
          );                      
        })}
        <div className="split right">
            <div className="centered"
              ref={this.onRef}
              style={{ width: "100%", height: "100%", position: "absolute" }}>
            </div>
        </div>
      </div>
    );
  }
}
