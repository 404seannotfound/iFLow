import { useState, useRef } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { Smile, Image as ImageIcon } from 'lucide-react';
import EmojiPicker from 'emoji-picker-react';

export default function RichTextEditor({ value, onChange, placeholder = "Write something..." }) {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const quillRef = useRef(null);

  const modules = {
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      ['link', 'image'],
      ['clean']
    ],
  };

  const formats = [
    'header',
    'bold', 'italic', 'underline', 'strike',
    'list', 'bullet',
    'link', 'image'
  ];

  const handleEmojiClick = (emojiData) => {
    const editor = quillRef.current?.getEditor();
    if (editor) {
      const cursorPosition = editor.getSelection()?.index || 0;
      editor.insertText(cursorPosition, emojiData.emoji);
      editor.setSelection(cursorPosition + emojiData.emoji.length);
    }
    setShowEmojiPicker(false);
  };

  return (
    <div className="relative">
      <ReactQuill
        ref={quillRef}
        theme="snow"
        value={value}
        onChange={onChange}
        modules={modules}
        formats={formats}
        placeholder={placeholder}
        className="rich-text-editor"
      />
      
      <div className="absolute bottom-2 right-2 flex gap-2">
        <button
          type="button"
          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
          className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
        >
          <Smile size={20} className="text-gray-400" />
        </button>
      </div>

      {showEmojiPicker && (
        <div className="absolute bottom-12 right-0 z-50">
          <EmojiPicker
            onEmojiClick={handleEmojiClick}
            theme="dark"
            width={320}
            height={400}
          />
        </div>
      )}
    </div>
  );
}
