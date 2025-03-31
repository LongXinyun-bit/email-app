document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);

  // Add event listener to form submission
  document.querySelector('#compose-form').addEventListener('submit', send_email);

  // Create a div for viewing email if not exists
  if (!document.querySelector('#email-view')) {
    const emailView = document.createElement('div');
    emailView.id = 'email-view';
    emailView.style.display = 'none';
    document.querySelector('#emails-view').after(emailView);
  }
  
  // 点击任何区域重置所有邮件项的滑动状态
  document.addEventListener('click', function(event) {
    // 如果点击的不是邮件项或删除按钮
    if (!event.target.closest('.email-item') && !event.target.closest('.delete-btn')) {
      // 重置所有邮件项
      document.querySelectorAll('.email-item').forEach(item => {
        item.style.transform = 'translateX(0)';
      });
    }
  });

  // By default, load the inbox
  load_mailbox('inbox');
});

function compose_email() {

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';
  document.querySelector('#email-view').style.display = 'none';

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';
}

function send_email(event) {
  // Prevent form from submitting normally
  event.preventDefault();

  // Get form data
  const recipients = document.querySelector('#compose-recipients').value;
  const subject = document.querySelector('#compose-subject').value;
  const body = document.querySelector('#compose-body').value;

  // Send email using API
  fetch('/emails', {
    method: 'POST',
    body: JSON.stringify({
      recipients: recipients,
      subject: subject,
      body: body
    })
  })
  .then(response => response.json())
  .then(result => {
    // Check if email was sent successfully
    if (result.message) {
      // Load sent mailbox
      load_mailbox('sent');
    } else {
      // Show error message
      alert(result.error || 'Error sending email');
    }
  })
  .catch(error => {
    console.log('Error:', error);
    alert('Failed to send email');
  });
}

function load_mailbox(mailbox) {
  
  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#email-view').style.display = 'none';

  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;

  // Load emails for the mailbox
  fetch(`/emails/${mailbox}`)
  .then(response => response.json())
  .then(emails => {
    // Process each email
    emails.forEach(email => {
      // 创建容器div来包含邮件和删除按钮
      const emailContainer = document.createElement('div');
      emailContainer.className = 'email-item-container';
      
      // 创建邮件div
      const emailDiv = document.createElement('div');
      
      // 设置邮件样式
      emailDiv.className = 'email-item';
      emailDiv.style.border = '1px solid #ccc';
      emailDiv.style.margin = '0';
      emailDiv.style.padding = '10px';
      emailDiv.style.cursor = 'pointer';
      emailDiv.style.borderRadius = '5px';
      emailDiv.dataset.id = email.id;
      
      // 根据已读状态设置背景色
      emailDiv.style.backgroundColor = email.read ? '#f0f0f0' : 'white';
      
      // 添加邮件内容
      emailDiv.innerHTML = `
        <span style="font-weight: ${email.read ? 'normal' : 'bold'}"><strong>From:</strong> ${email.sender}</span>
        <span style="margin-left: 20px;"><strong>Subject:</strong> ${email.subject}</span>
        <span style="float: right; color: gray;">${email.timestamp}</span>
      `;
      
      // 创建删除按钮
      const deleteBtn = document.createElement('div');
      deleteBtn.className = 'delete-btn';
      deleteBtn.innerHTML = '<strong>Delete</strong>';
      // 确保直接设置样式
      deleteBtn.style.backgroundColor = '#dc3545';
      deleteBtn.style.color = 'white';
      deleteBtn.style.display = 'flex';
      deleteBtn.style.alignItems = 'center';
      deleteBtn.style.justifyContent = 'center';
      deleteBtn.style.position = 'absolute';
      deleteBtn.style.right = '0';
      deleteBtn.style.top = '0';
      deleteBtn.style.bottom = '0';
      deleteBtn.style.width = '80px';
      deleteBtn.style.borderRadius = '0 5px 5px 0';
      deleteBtn.style.fontWeight = 'bold';
      deleteBtn.style.cursor = 'pointer'; // 添加手型光标
      deleteBtn.style.userSelect = 'none'; // 防止文本被选中
      
      deleteBtn.addEventListener('click', (e) => {
        e.stopPropagation(); // 防止触发邮件的点击事件
        
        // 添加点击视觉反馈
        deleteBtn.style.backgroundColor = '#b30000';
        
        // 如果浏览器支持触觉反馈API
        if (window.navigator && window.navigator.vibrate) {
          window.navigator.vibrate(50); // 短振动提供触觉反馈
        }
        
        // 模拟删除中的状态
        deleteBtn.innerHTML = '<strong>Deleting...</strong>';
        
        // 调用删除函数
        delete_email(email.id);
      });
      
      // 添加左滑功能
      let startX = 0;
      let currentX = 0;
      let isSwiping = false;
      
      // 触摸开始
      emailDiv.addEventListener('touchstart', (e) => {
        startX = e.touches[0].clientX;
        isSwiping = true;
      });
      
      // 鼠标按下
      emailDiv.addEventListener('mousedown', (e) => {
        startX = e.clientX;
        isSwiping = true;
        e.preventDefault();
      });
      
      // 触摸移动
      emailDiv.addEventListener('touchmove', (e) => {
        if (!isSwiping) return;
        currentX = e.touches[0].clientX;
        const diffX = currentX - startX;
        
        // 添加阻尼效果，左滑超过80px后增加阻力
        if (diffX < 0) {
          // 应用阻尼系数，使滑动越远阻力越大
          let dampenedX;
          if (diffX > -80) {
            // 80px内正常滑动
            dampenedX = diffX;
          } else {
            // 超过80px后，添加阻尼效果
            dampenedX = -80 - (diffX + 80) * 0.2;
          }
          emailDiv.style.transform = `translateX(${dampenedX}px)`;
        }
      });
      
      // 鼠标移动
      document.addEventListener('mousemove', (e) => {
        if (!isSwiping) return;
        currentX = e.clientX;
        const diffX = currentX - startX;
        
        // 添加阻尼效果，左滑超过80px后增加阻力
        if (diffX < 0) {
          // 应用阻尼系数，使滑动越远阻力越大
          let dampenedX;
          if (diffX > -80) {
            // 80px内正常滑动
            dampenedX = diffX;
          } else {
            // 超过80px后，添加阻尼效果
            dampenedX = -80 - (diffX + 80) * 0.2;
          }
          emailDiv.style.transform = `translateX(${dampenedX}px)`;
        }
      });
      
      // 触摸结束
      emailDiv.addEventListener('touchend', () => {
        if (!isSwiping) return;
        finishSwipe();
      });
      
      // 鼠标松开
      document.addEventListener('mouseup', () => {
        if (!isSwiping) return;
        finishSwipe();
      });
      
      // 结束滑动并决定是否显示删除按钮
      function finishSwipe() {
        isSwiping = false;
        const diffX = currentX - startX;
        
        // 降低阈值以提高敏感度（从-40px改为-30px）
        if (diffX < -30) {
          // 添加过渡动画，使移动更平滑
          emailDiv.style.transition = 'transform 0.2s ease';
          emailDiv.style.transform = 'translateX(-80px)';
          
          // 突出显示删除按钮，增加视觉反馈
          deleteBtn.style.transition = 'background-color 0.2s ease';
          deleteBtn.style.backgroundColor = '#ff0000'; // 更鲜艳的红色
          
          // 为删除按钮添加脉动动画效果
          setTimeout(() => {
            deleteBtn.style.backgroundColor = '#dc3545';
          }, 200);
        } else {
          // 更快速的回弹动画
          emailDiv.style.transition = 'transform 0.15s ease-out';
          emailDiv.style.transform = 'translateX(0)';
        }
        
        // 重置过渡效果，以便下次滑动时不受影响
        setTimeout(() => {
          emailDiv.style.transition = '';
        }, 200);
      }
      
      // 点击邮件查看详情（但不是在滑动时）
      emailDiv.addEventListener('click', () => {
        if (currentX !== startX) return; // 如果有滑动，不触发点击
        view_email(email.id);
      });
      
      // 添加元素到容器
      emailContainer.appendChild(emailDiv);
      emailContainer.appendChild(deleteBtn);
      
      // 添加到邮件列表
      document.querySelector('#emails-view').append(emailContainer);
    });
  })
  .catch(error => {
    console.log('Error loading emails:', error);
    document.querySelector('#emails-view').innerHTML += '<p>Error loading emails</p>';
  });
}

function view_email(email_id) {
  // Hide other views and show email view
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#email-view').style.display = 'block';
  
  // Clear email view
  document.querySelector('#email-view').innerHTML = '';
  
  // Load the email data
  fetch(`/emails/${email_id}`)
  .then(response => response.json())
  .then(email => {
    // Mark email as read
    if (!email.read) {
      fetch(`/emails/${email_id}`, {
        method: 'PUT',
        body: JSON.stringify({
          read: true
        })
      });
    }
    
    // Create the email detail container
    const emailContainer = document.createElement('div');
    emailContainer.className = 'email-detail';
    emailContainer.style.padding = '20px';
    emailContainer.style.border = '1px solid #ddd';
    emailContainer.style.borderRadius = '5px';
    emailContainer.style.margin = '10px 0';
    
    // Email header information
    emailContainer.innerHTML = `
      <div style="margin-bottom: 20px;">
        <p><strong>From:</strong> ${email.sender}</p>
        <p><strong>To:</strong> ${email.recipients.join(', ')}</p>
        <p><strong>Subject:</strong> ${email.subject}</p>
        <p><strong>Timestamp:</strong> ${email.timestamp}</p>
      </div>
      <hr>
      <div style="margin: 20px 0; white-space: pre-wrap;">${email.body}</div>
      <hr>
    `;
    
    // Add buttons container
    const buttonContainer = document.createElement('div');
    buttonContainer.style.marginTop = '15px';
    
    // Add Reply button
    const replyButton = document.createElement('button');
    replyButton.className = 'btn btn-primary mr-2';
    replyButton.textContent = 'Reply';
    replyButton.addEventListener('click', function() {
      reply_to_email(email);
    });
    buttonContainer.appendChild(replyButton);
    
    // Add Archive/Unarchive button (only for non-sent emails)
    if (email.sender !== document.querySelector('h2').textContent) {
      const archiveButton = document.createElement('button');
      archiveButton.className = 'btn btn-secondary ml-2';
      archiveButton.textContent = email.archived ? 'Unarchive' : 'Archive';
      archiveButton.addEventListener('click', function() {
        archive_email(email.id, !email.archived);
      });
      buttonContainer.appendChild(archiveButton);
    }
    
    // Add the buttons to the email container
    emailContainer.appendChild(buttonContainer);
    
    // Add the email container to the email view
    document.querySelector('#email-view').appendChild(emailContainer);
  })
  .catch(error => {
    console.log('Error viewing email:', error);
    document.querySelector('#email-view').innerHTML = '<p>Error loading email</p>';
  });
}

function archive_email(email_id, archive_status) {
  // Send request to archive/unarchive the email
  fetch(`/emails/${email_id}`, {
    method: 'PUT',
    body: JSON.stringify({
      archived: archive_status
    })
  })
  .then(() => {
    // After archiving/unarchiving, load the inbox
    load_mailbox('inbox');
  })
  .catch(error => {
    console.log('Error archiving email:', error);
    alert('Error archiving email');
  });
}

function reply_to_email(email) {
  // Show compose view
  compose_email();
  
  // Fill in recipient with the sender
  document.querySelector('#compose-recipients').value = email.sender;
  
  // Fill in subject line with Re: prefix if needed
  let subject = email.subject;
  if (!subject.startsWith('Re:')) {
    subject = `Re: ${subject}`;
  }
  document.querySelector('#compose-subject').value = subject;
  
  // Fill in body with quote from original email
  const body = `On ${email.timestamp} ${email.sender} wrote:\n${email.body}\n\n`;
  document.querySelector('#compose-body').value = body;
}

function delete_email(email_id) {
  // 获取要删除的邮件项
  const emailItem = document.querySelector(`.email-item[data-id="${email_id}"]`);
  const emailContainer = emailItem ? emailItem.parentElement : null;
  
  if (emailContainer) {
    // 添加删除动画
    emailContainer.style.transition = 'all 0.3s ease-out';
    emailContainer.style.height = `${emailContainer.offsetHeight}px`; // 锁定高度
    
    // 淡出效果
    setTimeout(() => {
      emailContainer.style.opacity = '0';
      emailContainer.style.height = '0';
      emailContainer.style.marginTop = '0';
      emailContainer.style.marginBottom = '0';
      emailContainer.style.paddingTop = '0';
      emailContainer.style.paddingBottom = '0';
      emailContainer.style.overflow = 'hidden';
    }, 50);
  }
  
  // 发送删除请求
  fetch(`/emails/${email_id}`, {
    method: 'DELETE'
  })
  .then(response => {
    if (response.ok) {
      if (!emailContainer) {
        // 如果没有找到邮件项，直接刷新邮箱
        const currentMailbox = document.querySelector('#emails-view h3').textContent.toLowerCase();
        load_mailbox(currentMailbox);
      } else {
        // 等待动画完成后移除元素
        setTimeout(() => {
          emailContainer.remove();
          
          // 检查是否还有邮件，如果没有则显示提示
          const emailCount = document.querySelectorAll('.email-item-container').length;
          const mailboxTitle = document.querySelector('#emails-view h3').textContent;
          if (emailCount === 0) {
            const emptyMessage = document.createElement('p');
            emptyMessage.style.textAlign = 'center';
            emptyMessage.style.color = '#666';
            emptyMessage.style.marginTop = '20px';
            emptyMessage.textContent = `${mailboxTitle} is empty`;
            document.querySelector('#emails-view').appendChild(emptyMessage);
          }
        }, 300);
      }
    } else {
      alert('Failed to delete email');
      // 恢复元素状态
      if (emailContainer) {
        emailContainer.style.transition = '';
        emailContainer.style.opacity = '1';
        emailContainer.style.height = '';
        emailContainer.style.margin = '';
        emailContainer.style.padding = '';
      }
    }
  })
  .catch(error => {
    console.log('Error deleting email:', error);
    alert('Error deleting email');
    // 恢复元素状态
    if (emailContainer) {
      emailContainer.style.transition = '';
      emailContainer.style.opacity = '1';
      emailContainer.style.height = '';
      emailContainer.style.margin = '';
      emailContainer.style.padding = '';
    }
  });
}