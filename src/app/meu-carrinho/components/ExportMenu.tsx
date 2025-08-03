import React, { useState, useEffect, useRef } from "react"
import { jsPDF } from "jspdf"
import autoTable from "jspdf-autotable"
import type { ProductInCart } from "@/types/carts"
import type { Donor } from "@/types/donor"
import { searchDonors } from "@/api/donors"
import "./ExportMenu.css"

interface ExportMenuProps {
  isOpen: boolean
  onClose: () => void
  products: ProductInCart[]
  cartType: "Entrada" | "Saída"
  id_car: string
  socket: WebSocket
}

interface FormData {
  data: string
  nomeDoador?: string
  contadoPor?: string
  armazem?: string
  destinatario?: string
  realizadoPor?: string
  motivo?: string
}

interface AttachedFile {
  file: File
  preview: string
  type: string
}

type Step = "initial" | "entrada" | "saida-selection" | "doacao" | "quebra"

const ExportMenu: React.FC<ExportMenuProps> = ({ isOpen, onClose, products, cartType, id_car, socket }) => {
  const [currentStep, setCurrentStep] = useState<Step>("initial")
  const [formData, setFormData] = useState<FormData>({
    data: new Date().toISOString().split("T")[0], // Today's date in YYYY-MM-DD format
    armazem: "Benfica",
  })
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([])
  const [donorSearchTerm, setDonorSearchTerm] = useState<string>("")
  const [donors, setDonors] = useState<Donor[]>([])
  const [showDonorResults, setShowDonorResults] = useState<boolean>(false)
  const [isSearching, setIsSearching] = useState<boolean>(false)
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const hasSelectedDonor = useRef<boolean>(false)

  // Debounced search for donors
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }

    if (donorSearchTerm.trim().length === 0) {
      setDonors([])
      setShowDonorResults(false)
      hasSelectedDonor.current = false
      return
    }

    if (hasSelectedDonor.current) {
      if (formData.nomeDoador?.includes(donorSearchTerm)) {
        return
      }
      hasSelectedDonor.current = false
    }

    setIsSearching(true)
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const results = await searchDonors(donorSearchTerm)
        setDonors(results)
        setShowDonorResults(true)
      } catch (error) {
        console.error("Erro ao pesquisar doadores:", error)
      } finally {
        setIsSearching(false)
      }
    }, 500)

    // Cleanup function
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }
    }
  }, [donorSearchTerm, formData.nomeDoador])

  // Handle clicks outside the donor search results
  const handleOutsideClick = (e: MouseEvent) => {
    const target = e.target as Node
    const donorSearchDiv = document.getElementById("donor-search-container")
    if (donorSearchDiv && !donorSearchDiv.contains(target)) {
      setShowDonorResults(false)
      if (donorSearchTerm.trim() && !hasSelectedDonor.current) {
        const matchingDonor = donors.find((d) => d.name.toLowerCase() === donorSearchTerm.toLowerCase())
        if (matchingDonor) {
          selectDonor(matchingDonor)
        }
      }
    }
  }

  // Adicionar e remover event listener para cliques fora
  useEffect(() => {
    document.addEventListener("mousedown", handleOutsideClick)
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick)
    }
  }, [])

  if (!isOpen) return null

  if (products.length === 0) {
    return (
      <div className="popup-overlay">
        <div className="popup-content" style={{ textAlign: "center" }}>
          <h2>Nenhum produto para exportar</h2>
          <button className="button blur-button" onClick={onClose} style={{ marginTop: "2rem" }}>
            Fechar
          </button>
        </div>
      </div>
    )
  }

  // Helper function to generate a file name with a timestamp
  const getFileNameWithTimestamp = (extension: string) => {
    // Using form data
    const date = formData.data ? new Date(formData.data) : new Date()
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, "0")
    const day = String(date.getDate()).padStart(2, "0")
    const now = new Date()
    const hours = String(now.getHours()).padStart(2, "0")
    const minutes = String(now.getMinutes()).padStart(2, "0")

    return `produtos_ajuda_de_berco_${year}-${month}-${day}_${hours}-${minutes}.${extension}`
  }

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleFileAttachment = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (files) {
      Array.from(files).forEach((file) => {
        if (file.type.startsWith("image/") || file.type === "application/pdf") {
          const reader = new FileReader()
          reader.onload = (e) => {
            const newFile: AttachedFile = {
              file,
              preview: e.target?.result as string,
              type: file.type,
            }
            setAttachedFiles((prev) => [...prev, newFile])
          }
          reader.readAsDataURL(file)
        }
      })
    }
  }

  const removeAttachedFile = (index: number) => {
    setAttachedFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const addImageToPDF = (doc: jsPDF, imageData: string, isFirstAttachment: boolean): void => {
    try {
      const img = new Image()
      img.src = imageData

      // Add new page for each attachment
      doc.addPage()

      // Add title only on the first attachment page
      if (isFirstAttachment) {
        doc.setFontSize(18)
        doc.setTextColor(0, 0, 0)
        const title = "Anexos"
        const pageWidth = doc.internal.pageSize.width
        doc.text(title, pageWidth / 2, 30, { align: "center" })
      }

      // Calculate image dimensions to occupy most of the page
      const pageWidth = doc.internal.pageSize.width
      const pageHeight = doc.internal.pageSize.height
      const margin = 20
      const titleSpace = isFirstAttachment ? 50 : 20 // Space for title if it's the first attachment

      const maxWidth = pageWidth - margin * 2
      const maxHeight = pageHeight - titleSpace - margin

      let imgWidth = maxWidth
      let imgHeight = maxHeight

      // Maintain aspect ratio
      const canvas = document.createElement("canvas")
      const ctx = canvas.getContext("2d")
      if (ctx) {
        canvas.width = img.width || 200
        canvas.height = img.height || 200
        ctx.drawImage(img, 0, 0)

        const aspectRatio = canvas.width / canvas.height

        // Calculate dimensions maintaining aspect ratio
        if (maxWidth / maxHeight > aspectRatio) {
          // Height is the limiting factor
          imgHeight = maxHeight
          imgWidth = imgHeight * aspectRatio
        } else {
          // Width is the limiting factor
          imgWidth = maxWidth
          imgHeight = imgWidth / aspectRatio
        }
      }

      // Center the image on the page
      const xPosition = (pageWidth - imgWidth) / 2
      const yPosition = titleSpace + (maxHeight - imgHeight) / 2

      doc.addImage(imageData, "JPEG", xPosition, yPosition, imgWidth, imgHeight)
    } catch (error) {
      console.error("Error adding image to PDF:", error)
    }
  }

  const exportAsPDF = () => {
    const doc = new jsPDF()
    const sortedProducts = [...products].sort((a, b) => a.code.localeCompare(b.code))

    // Add image in top left corner
    const img = new Image()
    img.src = "/imgs/LogoAjudaDeBerço.png"
    img.onload = () => {
      doc.addImage(img, "PNG", 5, 5, 40, 17)

      // Title configuration
      doc.setFontSize(18)
      doc.setTextColor(0, 0, 0)

      // Add centered title
      const title = "Relatório Ajuda de Berço"
      const pageWidth = doc.internal.pageSize.width
      doc.text(title, pageWidth / 2, 20, { align: "center" })

      // Add date and time in smaller font
      doc.setFontSize(10)
      const now = new Date()
      const formattedDate = `${now.getDate().toString().padStart(2, "0")}/${(now.getMonth() + 1).toString().padStart(2, "0")}/${now.getFullYear()} ${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`
      doc.text(`Exportação: ${formattedDate}`, pageWidth / 2, 27, { align: "center" })

      doc.setFontSize(12)
      doc.setTextColor(0, 0, 0)
      doc.text(`Tipo: ${cartType}`, pageWidth / 2, 33, { align: "center" })

      // Add form information
      let yPosition = 45
      doc.setFontSize(12)
      doc.setTextColor(0, 0, 0)

      if (cartType === "Entrada") {
        // First line: Data and Nome Doador
        const entradaInfo1 = `Data: ${formData.data}${formData.nomeDoador ? ` | Nome Doador: ${formData.nomeDoador}` : ""}`
        doc.text(entradaInfo1, 20, yPosition)
        yPosition += 7

        // Second line: Contado Por (if exists)
        if (formData.contadoPor) {
          doc.text(`Contado Por: ${formData.contadoPor}`, 20, yPosition)
          yPosition += 7
        }
      } else {
        // First line: Data and Armazém
        const saidaInfo1 = `Data: ${formData.data}${formData.armazem ? ` | Armazém: ${formData.armazem}` : ""}`
        doc.text(saidaInfo1, 20, yPosition)
        yPosition += 7

        // Second line: Destinatário and Realizado por
        const saidaInfo2 = `${formData.destinatario ? `Destinatário: ${formData.destinatario}` : ""}${formData.realizadoPor ? ` | Realizado por: ${formData.realizadoPor}` : ""}`
        if (saidaInfo2.trim()) {
          doc.text(saidaInfo2, 20, yPosition)
          yPosition += 7
        }

        // Third line: Motivo (if exists)
        if (formData.motivo) {
          doc.text(`Motivo: ${formData.motivo}`, 20, yPosition)
          yPosition += 7
        }
      }

      yPosition += 10

      // Prepare data for table
      const tableColumn = ["Código", "Nome", "Qtd.", "Unidade", "Expira a", "Descrição"]
      const tableRows = sortedProducts.map((product) => [
        product.code,
        product.name,
        product.quantity,
        product.unit,
        product.expirationDate,
        product.description,
      ])

      // Use autoTable with vertical and horizontal lines and custom widths
      autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: yPosition,
        theme: "grid",
        styles: {
          lineColor: [0, 0, 0],
          lineWidth: 0.05,
        },
        columnStyles: {
          0: { cellWidth: 26 }, // Código
          1: { cellWidth: 37 }, // Nome
          2: { cellWidth: 15 }, // Quantidade
          3: { cellWidth: 18 }, // Unidade
          4: { cellWidth: 22 }, // Data de Validade
          5: { cellWidth: 64 }, // Descrição
        },
        headStyles: {
          fillColor: [66, 139, 202],
          textColor: 255,
          halign: "center",
          fontStyle: "bold",
        },
        bodyStyles: {
          halign: "center",
        },
        alternateRowStyles: {
          fillColor: [240, 240, 240],
        },
      })

      // Add attached images - each on a separate page
      if (attachedFiles.length > 0) {
        attachedFiles.forEach((attachedFile, index) => {
          if (attachedFile.type.startsWith("image/")) {
            const isFirstAttachment = index === 0
            addImageToPDF(doc, attachedFile.preview, isFirstAttachment)
          }
        })
      }

      // Save document
      doc.save(getFileNameWithTimestamp("pdf"))

      // Send socket message and close
      socket.send(
        JSON.stringify({
          action: "Export",
          id_car: id_car,
        }),
      )
      onClose()
    }
  }

  const handleInitialStep = () => {
    if (cartType === "Entrada") {
      setCurrentStep("entrada")
    } else {
      setCurrentStep("saida-selection")
    }
  }

  const renderFileAttachment = () => (
    <div className="file-attachment-container">
      <div className="file-input-container">
        <input 
          type="file" 
          multiple 
          accept="image/*,.pdf" 
          onChange={handleFileAttachment} 
          className="file-input-hidden" 
          id="file-input" 
        />
        <label htmlFor="file-input" className="file-input-button">
          <i className="fas fa-paperclip" style={{ marginRight: "8px" }}></i>
          Anexar Ficheiros
        </label>
      </div>
      {attachedFiles.length > 0 && (
        <div style={{ marginTop: "1rem" }}>
          <h4>Ficheiros Anexados:</h4>
          <div className="attached-files-grid">
            {attachedFiles.map((file, index) => (
              <div key={index} className="attached-file-item">
                {file.type.startsWith("image/") ? (
                  <img src={file.preview || "/placeholder.svg"} alt={file.file.name} className="file-preview-image" />
                ) : (
                  <div className="file-preview-placeholder">📄</div>
                )}
                <p className="file-name">{file.file.name}</p>
                <button onClick={() => removeAttachedFile(index)} className="remove-file-button">
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )

  const renderInitialStep = () => (
    <div className="popup-overlay">
      <div className="popup-content" style={{ textAlign: "center" }}>
        <h2>Finalizar Exportação</h2>
        <p>Clique em continuar para preencher as informações necessárias</p>
        <div style={{ display: "flex", justifyContent: "space-around", marginTop: "2rem" }}>
          <button className="button blur-button" onClick={handleInitialStep} style={{ padding: "0.5rem 2rem" }}>
            Continuar
          </button>
          <button className="button blur-button" onClick={onClose} style={{ padding: "0.5rem 2rem" }}>
            Cancelar
          </button>
        </div>
      </div>
    </div>
  )

  const renderEntradaForm = () => (
    <div className="popup-overlay">
      <div className="popup-content">
        <h2 style={{ textAlign: "center", marginBottom: "2rem" }}>Informações de Entrada</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {" "}
          <div>
            <label className="form-label">Data:</label>
            <input
              type="date"
              value={formData.data}
              onChange={(e) => handleInputChange("data", e.target.value)}
              className="form-input-date"
            />
          </div>
          <div className="form-row">
            <div className="donor-search-container" id="donor-search-container">
              <label className="form-label">Fornecedor/Doador:</label>
              <input
                type="text"
                value={donorSearchTerm}
                onChange={(e) => setDonorSearchTerm(e.target.value)}
                className="donor-search-input"
                placeholder="Pesquisar doadores..."
              />
              {isSearching && (
                <div className="donor-search-spinner">
                  <i className="fas fa-spinner fa-spin"></i>
                </div>
              )}
              {donorSearchTerm && !isSearching && (
                <div className="donor-search-clear" onClick={clearDonorSearch}>
                  <i className="fas fa-times"></i>
                </div>
              )}
              {showDonorResults && donors.length > 0 && (
                <div className="donor-results-container">
                  {donors.map((donor) => (
                    <div
                      key={donor.id}
                      onClick={() => selectDonor(donor)}
                      className="donor-result-item"
                      onMouseOver={(e) => {
                        e.currentTarget.style.backgroundColor = "#f5f5f5"
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.backgroundColor = "transparent"
                      }}
                    >
                      <strong>{donor.id}</strong>: {donor.name}
                    </div>
                  ))}
                </div>
              )}
              {showDonorResults && donors.length === 0 && donorSearchTerm.trim() !== "" && !isSearching && (
                <div className="donor-no-results">Nenhum doador encontrado</div>
              )}
            </div>
            <div className="form-column">
              <label className="form-label">Contado Por:</label>
              <input
                type="text"
                value={formData.contadoPor || ""}
                onChange={(e) => handleInputChange("contadoPor", e.target.value)}
                className="form-input"
              />
            </div>
          </div>
          {renderFileAttachment()}
        </div>
        <div style={{ display: "flex", justifyContent: "space-around", marginTop: "2rem" }}>
          <button className="button blur-button" onClick={exportAsPDF} style={{ padding: "0.5rem 2rem" }}>
            Finalizar
          </button>
          <button className="button blur-button" onClick={onClose} style={{ padding: "0.5rem 2rem" }}>
            Cancelar
          </button>
        </div>
      </div>
    </div>
  )

  const renderSaidaSelection = () => (
    <div className="popup-overlay">
      <div className="popup-content" style={{ textAlign: "center" }}>
        <h2>Tipo de Saída</h2>
        <p>Selecione o tipo de saída:</p>
        <div style={{ display: "flex", justifyContent: "space-around", marginTop: "2rem" }}>
          <button
            className="button blur-button"
            onClick={() => setCurrentStep("doacao")}
            style={{ padding: "0.5rem 2rem" }}
          >
            Doação
          </button>
          <button
            className="button blur-button"
            onClick={() => setCurrentStep("quebra")}
            style={{ padding: "0.5rem 2rem" }}
          >
            Quebra
          </button>
        </div>
        <button className="button blur-button" onClick={onClose} style={{ marginTop: "2rem" }}>
          Cancelar
        </button>
      </div>
    </div>
  )

  const renderDoacaoForm = () => (
    <div className="popup-overlay">
      <div className="popup-content">
        <h2 style={{ textAlign: "center", marginBottom: "2rem" }}>Informações de Doação</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div style={{ display: "flex", gap: "1rem" }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: "block", marginBottom: "0.5rem" }}>Data:</label>
              <input
                type="date"
                value={formData.data}
                onChange={(e) => handleInputChange("data", e.target.value)}
                style={{ width: "100%", padding: "0.5rem", border: "1px solid #ccc", borderRadius: "4px" }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: "block", marginBottom: "0.5rem" }}>Armazém:</label>
              <input
                type="text"
                value={formData.armazem || "Benfica"}
                onChange={(e) => handleInputChange("armazem", e.target.value)}
                style={{ width: "100%", padding: "0.5rem", border: "1px solid #ccc", borderRadius: "4px" }}
              />
            </div>
          </div>
          <div style={{ display: "flex", gap: "1rem" }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: "block", marginBottom: "0.5rem" }}>Destinatário:</label>
              <input
                type="text"
                value={formData.destinatario || ""}
                onChange={(e) => handleInputChange("destinatario", e.target.value)}
                style={{ width: "100%", padding: "0.5rem", border: "1px solid #ccc", borderRadius: "4px" }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: "block", marginBottom: "0.5rem" }}>Realizado por:</label>
              <input
                type="text"
                value={formData.realizadoPor || ""}
                onChange={(e) => handleInputChange("realizadoPor", e.target.value)}
                style={{ width: "100%", padding: "0.5rem", border: "1px solid #ccc", borderRadius: "4px" }}
              />
            </div>
          </div>
          {renderFileAttachment()}
        </div>
        <div style={{ display: "flex", justifyContent: "space-around", marginTop: "2rem" }}>
          <button className="button blur-button" onClick={exportAsPDF} style={{ padding: "0.5rem 2rem" }}>
            Finalizar
          </button>
          <button
            className="button blur-button"
            onClick={() => setCurrentStep("saida-selection")}
            style={{ padding: "0.5rem 2rem" }}
          >
            Voltar
          </button>
          <button className="button blur-button" onClick={onClose} style={{ padding: "0.5rem 2rem" }}>
            Cancelar
          </button>
        </div>
      </div>
    </div>
  )

  const renderQuebraForm = () => (
    <div className="popup-overlay">
      <div className="popup-content">
        <h2 style={{ textAlign: "center", marginBottom: "2rem" }}>Informações de Quebra</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div style={{ display: "flex", gap: "1rem" }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: "block", marginBottom: "0.5rem" }}>Data:</label>
              <input
                type="date"
                value={formData.data}
                onChange={(e) => handleInputChange("data", e.target.value)}
                style={{ width: "100%", padding: "0.5rem", border: "1px solid #ccc", borderRadius: "4px" }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: "block", marginBottom: "0.5rem" }}>Armazém:</label>
              <input
                type="text"
                value={formData.armazem || "Benfica"}
                onChange={(e) => handleInputChange("armazem", e.target.value)}
                style={{ width: "100%", padding: "0.5rem", border: "1px solid #ccc", borderRadius: "4px" }}
              />
            </div>
          </div>
          <div>
            <label style={{ display: "block", marginBottom: "0.5rem" }}>Motivo:</label>
            <input
              type="text"
              value={formData.motivo || ""}
              onChange={(e) => handleInputChange("motivo", e.target.value)}
              style={{ width: "100%", padding: "0.5rem", border: "1px solid #ccc", borderRadius: "4px" }}
            />
          </div>
          <div style={{ display: "flex", gap: "1rem" }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: "block", marginBottom: "0.5rem" }}>Destinatário:</label>
              <input
                type="text"
                value={formData.destinatario || ""}
                onChange={(e) => handleInputChange("destinatario", e.target.value)}
                style={{ width: "100%", padding: "0.5rem", border: "1px solid #ccc", borderRadius: "4px" }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: "block", marginBottom: "0.5rem" }}>Realizado por:</label>
              <input
                type="text"
                value={formData.realizadoPor || ""}
                onChange={(e) => handleInputChange("realizadoPor", e.target.value)}
                style={{ width: "100%", padding: "0.5rem", border: "1px solid #ccc", borderRadius: "4px" }}
              />
            </div>
          </div>
          {renderFileAttachment()}
        </div>
        <div style={{ display: "flex", justifyContent: "space-around", marginTop: "2rem" }}>
          <button className="button blur-button" onClick={exportAsPDF} style={{ padding: "0.5rem 2rem" }}>
            Finalizar
          </button>
          <button
            className="button blur-button"
            onClick={() => setCurrentStep("saida-selection")}
            style={{ padding: "0.5rem 2rem" }}
          >
            Voltar
          </button>
          <button className="button blur-button" onClick={onClose} style={{ padding: "0.5rem 2rem" }}>
            Cancelar
          </button>
        </div>
      </div>
    </div>
  )

  // Função para limpar o campo de pesquisa
  const clearDonorSearch = () => {
    setDonorSearchTerm("")
    setShowDonorResults(false)
    hasSelectedDonor.current = false
    handleInputChange("nomeDoador", "")
  }

  const selectDonor = (donor: Donor) => {
    handleInputChange("nomeDoador", `${donor.id} - ${donor.name}`)
    setShowDonorResults(false)
    setDonorSearchTerm(donor.name)
    hasSelectedDonor.current = true
    setTimeout(() => {
      setDonors([])
    }, 100)
  }

  // Render based on current step
  switch (currentStep) {
    case "initial":
      return renderInitialStep()
    case "entrada":
      return renderEntradaForm()
    case "saida-selection":
      return renderSaidaSelection()
    case "doacao":
      return renderDoacaoForm()
    case "quebra":
      return renderQuebraForm()
    default:
      return renderInitialStep()
  }
}

export default ExportMenu
