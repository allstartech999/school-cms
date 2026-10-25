#!/usr/bin/env python3
"""
Import remaining 4 Facebook Posts to School CMS Production via MCP
"""

import sys
import time
import urllib.request
import re
import json

sys.path.append('/home/fame/school-cms/.agents/skills/school-cms-mcp/scripts')
from client import SchoolCMSMCPClient

REMAINING_POSTS = [
    {
        "fb_url": "https://www.facebook.com/1683617060442883",
        "title": "ขอแสดงความยินดีกับนักเรียนชั้น ม.6 ผ่านการคัดเลือก มหาวิทยาลัยมหาสารคาม รอบ Portfolio",
        "category": "วิชาการ",
        "summary": "ขอแสดงความยินดีกับนักเรียนชั้น ม.6 ทั้ง 3 คน ในโอกาสผ่านการคัดเลือกเข้าศึกษาระดับอุดมศึกษา มหาวิทยาลัยมหาสารคาม รอบที่ 1 Portfolio (โควตาเด็กดีมีที่เรียน ภาคตะวันออกเฉียงเหนือ)",
        "content": """🎉 **โรงเรียนโพนงามพิทยานุกูล ขอแสดงความยินดีกับคนเก่ง!** 🎓✨

ขอแสดงความยินดีกับนักเรียนชั้นมัธยมศึกษาปีที่ 6 ที่ผ่านการคัดเลือกเข้าศึกษาระดับอุดมศึกษา **มหาวิทยาลัยมหาสารคาม รอบที่ 1 Portfolio (โครงการโควตาเด็กดีมีที่เรียน ภาคตะวันออกเฉียงเหนือ)** ดังนี้:

1. 💻 **นายศุภชัย สอนบุญลา**  
   คณะวิทยาการสารสนเทศ สาขาวิชาวิทยาการคอมพิวเตอร์ (วท.บ.)
2. 🤝 **นางสาวชนิกานต์ พรมโภชน์**  
   คณะมนุษยศาสตร์และสังคมศาสตร์ สาขาวิชาการพัฒนาสังคมและชุมชน (ศศ.บ.)
3. 🏛️ **นางสาวสุชาดา เชื้อคีรี**  
   วิทยาลัยการเมืองการปกครอง สาขาวิชารัฐประศาสนศาสตร์ (ร.บ.)

ผู้บริหาร คณะครู บุคลากร และนักเรียนโพนงามพิทยานุกูลทุกคน ขอแสดงความยินดีและอวยพรให้นักเรียนประสบความสำเร็จในก้าวต่อไปของการศึกษา และนำความรู้ความสามารถไปพัฒนาสังคมต่อไปค่ะ 💚🤍

---
*แหล่งที่มา: [เพจทางการโรงเรียนโพนงามพิทยานุกูล](https://www.facebook.com/phonngampittayanukul/posts/pfbid02yarh89dcCjskr3bzMH5LszmBTb5vUbecrLZR2eACXUVfFJyFjXpEjC9o5ynM1nShl)*"""
    },
    {
        "fb_url": "https://www.facebook.com/1686012130203376",
        "title": "ขอเรียนเชิญร่วมงานแสดงมุทิตาจิต แด่ผู้เกษียณอายุราชการ คุณครูสดชื่น ดวงคำน้อย",
        "category": "ประชาสัมพันธ์",
        "summary": "ขอเรียนเชิญคณะครู บุคลากรทางการศึกษา ผู้ปกครอง ศิษย์เก่า และผู้มีเกียรติทุกท่าน ร่วมแสดงมุทิตาจิตแด่ คุณครูสดชื่น ดวงคำน้อย (ครูชำนาญการพิเศษ) ในวันอังคารที่ 29 กันยายน 2569 ณ โดมเอนกประสงค์",
        "content": """📣 **โรงเรียนโพนงามพิทยานุกูล ขอเรียนเชิญร่วมแสดงมุทิตาจิต แด่ผู้เกษียณอายุราชการ**

ขอเรียนเชิญ คณะครู บุคลากรทางการศึกษา ผู้ปกครอง ศิษย์เก่า และผู้มีเกียรติทุกท่าน ร่วมแสดงมุทิตาจิต แด่ผู้เกษียณอายุราชการ เพื่อร่วมแสดงความรัก ความเคารพ และเป็นขวัญกำลังใจแด่ **คุณครูสดชื่น ดวงคำน้อย (ครูชำนาญการพิเศษ)**

🗓️ **วันอังคารที่ 29 กันยายน พ.ศ. 2569**  
📍 **สถานที่:** ณ โดมเอนกประสงค์ โรงเรียนโพนงามพิทยานุกูล

### 📋 กำหนดการ
* 💛 **เวลา 07:00 น.** – พิธีเจริญพระพุทธมนต์
* 💛 **เวลา 09:09 น.** – พิธีบายศรีสู่ขวัญ
* 💛 **เวลา 11:30 น. เป็นต้นไป** – พิธีมอบของที่ระลึกและร่วมรับประทานอาหาร (โต๊ะจีน)

👉 ผู้ประสงค์ร่วมงานสามารถแจ้งความประสงค์และสำรองที่นั่งโต๊ะจีน  
(โต๊ะละ 1,600 บาท / ท่านละ 200 บาท รวมโต๊ะละ 8 ท่าน)  
**ติดต่อสอบถามหรือจองโต๊ะจีน:** คุณครูโยธิน อสุริยิน (ครูโย) โทร. 088-6579685

---
*แหล่งที่มา: [เพจทางการโรงเรียนโพนงามพิทยานุกูล](https://www.facebook.com/phonngampittayanukul/posts/pfbid0yCuaedq52y7jQ3sesMZ6vHkMUMR9kVD4FfwGPvket8naFhcmnkxbrYhxusmqfmjql)*"""
    },
    {
        "fb_url": "https://www.facebook.com/1686740543463868",
        "title": "โรงเรียนโพนงามพิทยานุกูล เข้าร่วมกิจกรรมตลาดนัดวิชาการ ครั้งที่ 3 สพม.มหาสารคาม",
        "category": "วิชาการ",
        "summary": "นายวัชรินทร์ ติดวงษา ผู้อำนวยการโรงเรียน นำคณะครูและนักเรียนเข้าร่วมกิจกรรมตลาดนัดวิชาการ ครั้งที่ 3 สพม.มหาสารคาม แลกเปลี่ยนเรียนรู้ Best Practice นำเสนอนวัตกรรมการศึกษา ณ โรงเรียนวาปีปทุม",
        "content": """วันที่ 18 กันยายน 2569 **นายวัชรินทร์ ติดวงษา ผู้อำนวยการโรงเรียนโพนงามพิทยานุกูล** พร้อมด้วยคณะครู และนักเรียน เข้าร่วมกิจกรรม **ตลาดนัดวิชาการ ครั้งที่ 3 ประจำปีการศึกษา 2569** ซึ่งจัดโดยสำนักงานเขตพื้นที่การศึกษามัธยมศึกษามหาสารคาม

งานในครั้งนี้จัดขึ้นภายใต้แนวคิด **\"สืบสานวัฒนธรรม สร้างสรรค์นวัตกรรม สู่โลกดิจิทัล\"** เพื่อเป็นเวทีแลกเปลี่ยนเรียนรู้วิธีปฏิบัติที่เป็นเลิศ (Best Practice) และนำเสนอแนวคิด ผลงาน ตลอดจนนวัตกรรมทางการศึกษาของครูและนักเรียน ณ ห้องประชุมปทุมมา โรงเรียนวาปีปทุม อำเภอวาปีปทุม จังหวัดมหาสารคาม

---
*แหล่งที่มา: [เพจทางการโรงเรียนโพนงามพิทยานุกูล](https://www.facebook.com/phonngampittayanukul/posts/pfbid02jQ4w5FTZsKzc9Kvt9ZuCzJQzerRGpJGBidh3HZskcZ3M2W8XWgQoDhXbHKzPoT3ul)*"""
    },
    {
        "fb_url": "https://www.facebook.com/1688687566602499",
        "title": "ขอแสดงความยินดีกับนักเรียนคนเก่ง ผ่านการคัดเลือกเข้าศึกษาต่อ คณะครุศาสตร์ มหาวิทยาลัยราชภัฏมหาสารคาม",
        "category": "วิชาการ",
        "summary": "โรงเรียนโพนงามพิทยานุกูล ขอแสดงความยินดีกับ นางสาวชนิสรา ศิริสุรักษ์ และ นางสาวชนากานต์ ศรีนอก ในโอกาสผ่านการคัดเลือกเข้าศึกษาต่อระดับอุดมศึกษา สาขาวิชาพลศึกษา มรภ.มหาสารคาม",
        "content": """🎉 **โรงเรียนโพนงามพิทยานุกูล ขอแสดงความยินดีกับคนเก่ง!** 🎓🤍💚

โรงเรียนโพนงามพิทยานุกูล ขอแสดงความยินดี กับ **นางสาวชนิสรา ศิริสุรักษ์** และ **นางสาวชนากานต์ ศรีนอก** ในโอกาสผ่านการคัดเลือกเข้าศึกษาต่อ ระดับอุดมศึกษาใน **\"โครงการรับตรงโดยคณะ\"** 

* **คณะ:** คณะครุศาสตร์ 
* **หลักสูตร:** ครุศาสตรบัณฑิต (ค.บ.) 
* **สาขาวิชา:** พลศึกษา 
* **สถาบัน:** มหาวิทยาลัยราชภัฏมหาสารคาม

ขอให้อนาคตแม่พิมพ์ของชาติทั้งสองคนประสบความสำเร็จในหนทางการเรียนและการทำงาน มุ่งมั่น สู้ต่อไป และนำความภาคภูมิใจมาสู่ครอบครัวและโรงเรียนโพนงามพิทยานุกูลของเรานะคะ 👏✨

---
*แหล่งที่มา: [เพจทางการโรงเรียนโพนงามพิทยานุกูล](https://www.facebook.com/phonngampittayanukul/posts/pfbid02DzXwpBmDX2WAwzLNxjwc3anA5CcnQLMJaenGZuGgaGjkWKm7s9m27LXKM4uD7rB9l)*"""
    }
]


def get_fb_image(url):
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'})
    try:
        resp = urllib.request.urlopen(req)
        html = resp.read().decode('utf-8', errors='ignore')
        m = re.search(r'property=\"og:image\"\s+content=\"([^\"]+)\"', html)
        if m:
            return m.group(1).replace('&amp;', '&')
    except Exception as e:
        print(f"Error fetching image for {url}: {e}")
    return None


def main():
    print("Connecting to School CMS MCP Server (Production)...")
    client = SchoolCMSMCPClient()
    client.connect()
    print("Connected successfully!\n")

    for idx, item in enumerate(REMAINING_POSTS, start=7):
        print(f"[{idx}/10] Processing: {item['title'][:40]}...")
        
        fb_img = get_fb_image(item['fb_url'])
        uploaded_image_url = ""
        
        if fb_img:
            print(f"   Found og:image: {fb_img[:60]}...")
            try:
                upload_res = client.call_tool('upload_media_by_url', {
                    'source_url': fb_img,
                    'alt_text': item['title'],
                    'agent_name': 'Antigravity AI'
                })
                text_resp = upload_res.get('result', {}).get('content', [{}])[0].get('text', '')
                m_url = re.search(r'URL:\s*([^\n\r]+)', text_resp)
                if m_url:
                    uploaded_image_url = m_url.group(1).strip()
                    print(f"   Uploaded to CMS: {uploaded_image_url}")
                else:
                    print(f"   Upload failed: {text_resp[:100]}")
            except Exception as e:
                print(f"   Upload exception: {e}")
        else:
            print("   No og:image found on FB page.")

        if not uploaded_image_url:
            uploaded_image_url = "/uploads/2026/10/1792902699757059925-ai.jfif"

        post_res = client.call_tool('create_school_post', {
            'title': item['title'],
            'summary': item['summary'],
            'content': item['content'],
            'category': item['category'],
            'image_url': uploaded_image_url,
            'publish': True,
            'agent_name': 'Antigravity AI'
        })
        
        res_text = post_res.get('result', {}).get('content', [{}])[0].get('text', '')
        print(f"   Result: {res_text.replace(chr(10), ' ')}")
        time.sleep(1.5)

    print("\n All remaining posts imported successfully!")


if __name__ == '__main__':
    main()
